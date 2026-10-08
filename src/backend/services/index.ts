/**
 * TSR APP v1.0 — Services Métier Backend
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { db } from '../mock-db';
import {
  Booking,
  BookingCreationRequest,
  SearchTripsQuery,
  SeatWithStatus,
  Station,
  Trip,
  User,
  Ticket,
  QRCodeData,
} from '../models';
import { Validators, ValidationError } from '../validators';

// Helper Haversine pour calculer la distance en km entre 2 points GPS
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const StationService = {
  getAllStations(): Station[] {
    return db.stations.filter((s) => s.is_active);
  },

  getStationsWithDistance(userLat?: number, userLng?: number) {
    // Par défaut, centre de Ouagadougou si non géolocalisé
    const refLat = userLat ?? 12.3714;
    const refLng = userLng ?? -1.5197;

    return db.stations
      .filter((s) => s.is_active)
      .map((s) => {
        const distanceKm = calculateDistanceKm(refLat, refLng, s.latitude, s.longitude);
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;
        return {
          ...s,
          distanceKm,
          mapUrl,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  getStationById(id: string): Station | undefined {
    return db.stations.find((s) => s.id === id);
  },
};

export const TripService = {
  searchTrips(query: SearchTripsQuery) {
    db.purgeExpiredLocks();

    return db.trips
      .filter((trip) => {
        const route = db.routes.find((r) => r.id === trip.route_id);
        if (!route) return false;

        if (query.originStationId && route.origin_station_id !== query.originStationId) {
          return false;
        }
        if (query.destinationStationId && route.destination_station_id !== query.destinationStationId) {
          return false;
        }

        const vehicle = db.vehicles.find((v) => v.id === trip.vehicle_id);
        if (query.category && vehicle?.category !== query.category) {
          return false;
        }

        return trip.status === 'SCHEDULED' || trip.status === 'BOARDING';
      })
      .map((trip) => {
        const route = db.routes.find((r) => r.id === trip.route_id)!;
        const vehicle = db.vehicles.find((v) => v.id === trip.vehicle_id)!;
        const originStation = db.stations.find((s) => s.id === route.origin_station_id)!;
        const destinationStation = db.stations.find((s) => s.id === route.destination_station_id)!;

        // Calcul des places disponibles
        const bookedCount = db.tickets.filter(
          (t) => t.trip_id === trip.id && (t.status === 'VALID' || t.status === 'BOARDED')
        ).length;
        const lockedCount = db.seatLocks.filter((l) => l.trip_id === trip.id).length;
        const totalSeats = vehicle.total_seats;
        const availableSeats = Math.max(0, totalSeats - bookedCount - lockedCount);

        return {
          ...trip,
          route,
          vehicle,
          originStation,
          destinationStation,
          totalSeats,
          bookedCount,
          lockedCount,
          availableSeats,
        };
      });
  },

  getTripDetails(tripId: string) {
    const trip = db.trips.find((t) => t.id === tripId);
    if (!trip) throw new ValidationError('Voyage introuvable.', 'tripId');

    const route = db.routes.find((r) => r.id === trip.route_id)!;
    const vehicle = db.vehicles.find((v) => v.id === trip.vehicle_id)!;
    const originStation = db.stations.find((s) => s.id === route.origin_station_id)!;
    const destinationStation = db.stations.find((s) => s.id === route.destination_station_id)!;

    return {
      ...trip,
      route,
      vehicle,
      originStation,
      destinationStation,
    };
  },
};

export const SeatLockService = {
  getSeatsForTrip(tripId: string, currentSessionToken: string): SeatWithStatus[] {
    db.purgeExpiredLocks();

    const trip = db.trips.find((t) => t.id === tripId);
    if (!trip) throw new ValidationError('Voyage introuvable.', 'tripId');

    const vehicle = db.vehicles.find((v) => v.id === trip.vehicle_id);
    if (!vehicle) throw new ValidationError('Véhicule introuvable.', 'vehicleId');

    // Récupérer les billets déjà émis
    const bookedSeatNumbers = new Set(
      db.tickets
        .filter((t) => t.trip_id === tripId && (t.status === 'VALID' || t.status === 'BOARDED'))
        .map((t) => t.seat_number)
    );

    // Récupérer les verrous actifs
    const activeLocks = new Map(
      db.seatLocks.filter((l) => l.trip_id === tripId).map((l) => [l.seat_number, l])
    );

    return db.seats
      .filter((s) => s.vehicle_id === vehicle.id)
      .map((seat) => {
        let status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'SELECTED' = 'AVAILABLE';
        let lockedBySession: string | undefined = undefined;
        let expiresAt: string | undefined = undefined;

        if (bookedSeatNumbers.has(seat.seat_number)) {
          status = 'BOOKED';
        } else if (activeLocks.has(seat.seat_number)) {
          const lock = activeLocks.get(seat.seat_number)!;
          if (lock.session_token === currentSessionToken) {
            status = 'SELECTED';
          } else {
            status = 'LOCKED';
          }
          lockedBySession = lock.session_token;
          expiresAt = lock.expires_at;
        }

        const price = seat.tier === 'VIP' ? trip.price_vip : trip.price_standard;

        return {
          seatNumber: seat.seat_number,
          label: seat.seat_label,
          tier: seat.tier,
          status,
          price,
          rowIndex: seat.row_index,
          colIndex: seat.col_index,
          lockedBySession,
          expiresAt,
        };
      })
      .sort((a, b) => a.seatNumber - b.seatNumber);
  },

  lockSeat(tripId: string, seatNumber: number, sessionToken: string, userId?: string) {
    db.purgeExpiredLocks();

    // 1. Vérifier si le siège est déjà définitivement vendu
    const alreadyBooked = db.tickets.some(
      (t) => t.trip_id === tripId && t.seat_number === seatNumber && (t.status === 'VALID' || t.status === 'BOARDED')
    );
    if (alreadyBooked) {
      throw new ValidationError('Ce siège est déjà définitivement vendu.', 'seatNumber');
    }

    // 2. Vérifier si le siège est déjà verrouillé par un autre utilisateur
    const existingLock = db.seatLocks.find((l) => l.trip_id === tripId && l.seat_number === seatNumber);
    if (existingLock) {
      if (existingLock.session_token !== sessionToken) {
        throw new ValidationError(
          'Ce siège est en cours de sélection par un autre voyageur.',
          'seatNumber'
        );
      }
      // Prolonger le verrou
      existingLock.expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      return { success: true, seatNumber, expiresAt: existingLock.expires_at };
    }

    // 3. Poser le verrou de 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.seatLocks.push({
      id: `lock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      trip_id: tripId,
      seat_number: seatNumber,
      locked_by_user_id: userId,
      session_token: sessionToken,
      locked_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    return { success: true, seatNumber, expiresAt };
  },

  unlockSeat(tripId: string, seatNumber: number, sessionToken: string) {
    db.seatLocks = db.seatLocks.filter(
      (l) => !(l.trip_id === tripId && l.seat_number === seatNumber && l.session_token === sessionToken)
    );
    return { success: true, seatNumber };
  },
};

export const BookingService = {
  createBooking(request: BookingCreationRequest, sessionToken: string, customerId?: string) {
    db.purgeExpiredLocks();
    Validators.validateBooking(request);

    const trip = db.trips.find((t) => t.id === request.tripId);
    if (!trip) throw new ValidationError('Voyage inexistant.', 'tripId');

    // Vérifier que chaque siège est bien détenu par la session courante
    for (const p of request.passengers) {
      const lock = db.seatLocks.find(
        (l) => l.trip_id === request.tripId && l.seat_number === p.seatNumber && l.session_token === sessionToken
      );
      if (!lock) {
        // Tentative d'auto-verrouillage si libre
        SeatLockService.lockSeat(request.tripId, p.seatNumber, sessionToken, customerId);
      }
    }

    // Calculs tarifaires
    let subtotal = 0;
    let optionsAmount = 0;

    const bookingItems = request.passengers.map((p) => {
      const seat = db.seats.find((s) => s.vehicle_id === trip.vehicle_id && s.seat_number === p.seatNumber);
      const tier = seat?.tier === 'VIP' ? 'VIP' : 'STANDARD';
      const unitPrice = tier === 'VIP' ? trip.price_vip : trip.price_standard;

      subtotal += unitPrice;

      // Calcul des options par passager
      let itemOptionFee = 0;
      if (p.luggageExtraWeightKg > 0) {
        // 500 FCFA par tranche de 10 kg au-dessus de la franchise
        itemOptionFee += Math.ceil(p.luggageExtraWeightKg / 10) * 1000;
      }
      if (p.hasBicycle) itemOptionFee += 3000;
      if (p.hasMotorcycle) itemOptionFee += 15000;

      optionsAmount += itemOptionFee;

      return {
        id: `bki-${Date.now()}-${p.seatNumber}`,
        seatNumber: p.seatNumber,
        seatTier: tier as 'STANDARD' | 'VIP',
        unitPrice,
        luggageExtraWeightKg: p.luggageExtraWeightKg,
        hasBicycle: p.hasBicycle,
        hasMotorcycle: p.hasMotorcycle,
        itemOptionsFee: itemOptionFee,
      };
    });

    const insuranceFee = request.insuranceOptIn ? request.passengers.length * 100 : 0;
    const totalAmount = subtotal + optionsAmount + insuranceFee;

    const bookingRef = `TSR-BK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingId = `bk-${Date.now()}`;
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min pour régler

    const newBooking: Booking = {
      id: bookingId,
      booking_reference: bookingRef,
      customer_id: customerId,
      channel: 'MOBILE_APP',
      trip_id: request.tripId,
      is_third_party: request.isThirdParty,
      purchaser_name: request.purchaserName,
      purchaser_phone: Validators.formatBurkinaPhone(request.purchaserPhone),
      subtotal_amount: subtotal,
      options_amount: optionsAmount,
      discount_amount: 0,
      total_amount: totalAmount,
      insurance_opt_in: request.insuranceOptIn,
      insurance_fee: insuranceFee,
      status: 'PENDING_PAYMENT',
      payment_expires_at: paymentExpiresAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.bookings.push(newBooking);

    // Sauvegarde des passagers
    request.passengers.forEach((p) => {
      db.passengers.push({
        id: `pax-${Date.now()}-${p.seatNumber}`,
        booking_id: bookingId,
        seat_number: p.seatNumber,
        first_name: p.firstName,
        last_name: p.lastName,
        phone_number: Validators.formatBurkinaPhone(p.phone || request.purchaserPhone),
        id_card_number: p.idCardNumber,
        is_minor: false,
      });
    });

    // Enregistrement option colis si renseigné
    if (request.packageOption) {
      const route = db.routes.find((r) => r.id === trip.route_id)!;
      db.packages.push({
        id: `pkg-${Date.now()}`,
        tracking_code: `TSR-COLIS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        origin_station_id: route.origin_station_id,
        destination_station_id: route.destination_station_id,
        assigned_trip_id: trip.id,
        sender_name: request.purchaserName,
        sender_phone: Validators.formatBurkinaPhone(request.purchaserPhone),
        recipient_name: request.packageOption.recipientName,
        recipient_phone: Validators.formatBurkinaPhone(request.packageOption.recipientPhone),
        weight_kg: request.packageOption.weightKg,
        description: request.packageOption.description,
        shipping_fee: Math.ceil(request.packageOption.weightKg * 300),
        status: 'CREATED',
        registered_by_agent_id: 'd0000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      });
    }

    return {
      booking: newBooking,
      items: bookingItems,
      totalAmount,
    };
  },

  getBookingByReference(reference: string) {
    const booking = db.bookings.find((b) => b.booking_reference === reference);
    if (!booking) throw new ValidationError('Réservation introuvable.', 'reference');

    const trip = db.trips.find((t) => t.id === booking.trip_id)!;
    const route = db.routes.find((r) => r.id === trip.route_id)!;
    const originStation = db.stations.find((s) => s.id === route.origin_station_id)!;
    const destinationStation = db.stations.find((s) => s.id === route.destination_station_id)!;
    const passengers = db.passengers.filter((p) => p.booking_id === booking.id);

    return {
      booking,
      trip,
      route,
      originStation,
      destinationStation,
      passengers,
    };
  },
};

export const TicketService = {
  getUserTickets(userPhone?: string) {
    if (!userPhone) return db.tickets;

    // Trouver les réservations du client par téléphone
    const userBookings = db.bookings.filter(
      (b) => b.purchaser_phone === userPhone || b.customer_id === userPhone
    );
    const bookingIds = new Set(userBookings.map((b) => b.id));

    return db.tickets
      .filter((t) => bookingIds.has(t.booking_id) || t.passenger_id === 'pax-01')
      .map((ticket) => {
        const trip = db.trips.find((t) => t.id === ticket.trip_id);
        const route = trip ? db.routes.find((r) => r.id === trip.route_id) : undefined;
        const originStation = route ? db.stations.find((s) => s.id === route.origin_station_id) : undefined;
        const destinationStation = route ? db.stations.find((s) => s.id === route.destination_station_id) : undefined;
        const passenger = db.passengers.find((p) => p.id === ticket.passenger_id);
        const qrCode = db.qrCodes.find((q) => q.ticket_id === ticket.id);

        return {
          ticket,
          trip,
          route,
          originStation,
          destinationStation,
          passenger,
          qrCode,
        };
      });
  },
};

export const AuthService = {
  sendOtp(phone: string): { success: boolean; message: string; demoOtp: string } {
    if (!Validators.isValidBurkinaPhone(phone)) {
      throw new ValidationError('Numéro burkinabè invalide (+226...).', 'phone');
    }
    // OTP fixe démo 123456 pour test instantané en préproduction
    return {
      success: true,
      message: `Code OTP envoyé par SMS au ${phone}`,
      demoOtp: '123456',
    };
  },

  verifyOtpAndLogin(phone: string, otp: string) {
    if (otp !== '123456' && otp !== '000000') {
      throw new ValidationError('Code OTP invalide. Utilisez 123456 pour la démo.', 'otp');
    }

    const formatted = Validators.formatBurkinaPhone(phone);
    let user = db.users.find((u) => u.phone_number === formatted);

    if (!user) {
      // Création automatique si nouveau compte
      user = {
        id: `usr-${Date.now()}`,
        phone_number: formatted,
        first_name: 'Voyageur',
        last_name: 'TSR',
        role: 'CLIENT',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.push(user);
    }

    const token = `JWT-TSR-${user.id}-${Date.now()}`;
    return {
      token,
      user,
    };
  },

  register(data: { phone: string; firstName: string; lastName: string; password?: string }) {
    Validators.validateRegistration(data);
    const formatted = Validators.formatBurkinaPhone(data.phone);

    let user = db.users.find((u) => u.phone_number === formatted);
    if (user) {
      user.first_name = data.firstName;
      user.last_name = data.lastName;
    } else {
      user = {
        id: `usr-${Date.now()}`,
        phone_number: formatted,
        first_name: data.firstName,
        last_name: data.lastName,
        role: 'CLIENT',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.push(user);
    }

    const token = `JWT-TSR-${user.id}-${Date.now()}`;
    return { token, user };
  },
};

/**
 * TSR APP v1.0 — Moteur de Données Stateful en Mémoire (Compatible PostgreSQL)
 * Société de Transport TSR Transport (Burkina Faso)
 */
import {
  Station,
  Vehicle,
  Seat,
  Route,
  Trip,
  User,
  Booking,
  BookingItem,
  Passenger,
  Payment,
  PaymentTransaction,
  Ticket,
  QRCodeData,
  SeatLock,
  LoyaltyAccount,
  Package,
  AuditLog,
  FraudAlert,
} from './models';

class MockDatabase {
  public stations: Station[] = [];
  public vehicles: Vehicle[] = [];
  public seats: Seat[] = [];
  public routes: Route[] = [];
  public trips: Trip[] = [];
  public users: User[] = [];
  public bookings: Booking[] = [];
  public bookingItems: BookingItem[] = [];
  public passengers: Passenger[] = [];
  public payments: Payment[] = [];
  public paymentTransactions: PaymentTransaction[] = [];
  public tickets: Ticket[] = [];
  public qrCodes: QRCodeData[] = [];
  public seatLocks: SeatLock[] = [];
  public loyaltyAccounts: LoyaltyAccount[] = [];
  public packages: Package[] = [];
  public auditLogs: AuditLog[] = [];
  public fraudAlerts: FraudAlert[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    // 1. GARES TSR TRANSPORT AU BURKINA FASO
    this.stations = [
      {
        id: 'st-ouaga-01',
        city_id: 'city-ouaga',
        name: 'Gare Centrale TSR Ouagadougou',
        code: 'GARE-OUA-01',
        address: 'Avenue Bassawarga, Secteur 4, Ouagadougou',
        latitude: 12.3686,
        longitude: -1.5271,
        phone: '+226 25 31 00 11',
        opening_time: '05:00:00',
        closing_time: '23:00:00',
        is_active: true,
      },
      {
        id: 'st-bobo-01',
        city_id: 'city-bobo',
        name: 'Gare Principale TSR Bobo-Dioulasso',
        code: 'GARE-BOB-01',
        address: 'Boulevard de la Révolution, Secteur 1, Bobo-Dioulasso',
        latitude: 11.1783,
        longitude: -4.2974,
        phone: '+226 20 97 22 44',
        opening_time: '05:00:00',
        closing_time: '23:00:00',
        is_active: true,
      },
      {
        id: 'st-koudougou-01',
        city_id: 'city-koudougou',
        name: 'Gare TSR Koudougou',
        code: 'GARE-KDG-01',
        address: 'Route Nationale 1, Koudougou',
        latitude: 12.2531,
        longitude: -2.3622,
        phone: '+226 25 44 12 80',
        opening_time: '06:00:00',
        closing_time: '21:00:00',
        is_active: true,
      },
      {
        id: 'st-ouahigouya-01',
        city_id: 'city-ouahigouya',
        name: 'Gare TSR Ouahigouya',
        code: 'GARE-OHG-01',
        address: 'Avenue du 11 Décembre, Ouahigouya',
        latitude: 13.5828,
        longitude: -2.4216,
        phone: '+226 24 55 03 19',
        opening_time: '06:00:00',
        closing_time: '21:00:00',
        is_active: true,
      },
    ];

    // 2. VÉHICULES (CARS TSR 70 PLACES)
    this.vehicles = [
      {
        id: 'veh-vip-01',
        plate_number: '11-JJ-4567-BF',
        brand: 'Yutong',
        model: 'ZK6122HD Luxury',
        category: 'VIP',
        total_seats: 70,
        current_station_id: 'st-ouaga-01',
        status: 'IN_SERVICE',
        has_wifi: true,
        has_ac: true,
        has_usb_ports: true,
      },
      {
        id: 'veh-clim-02',
        plate_number: '11-KK-9821-BF',
        brand: 'Yutong',
        model: 'ZK6120 Cruiser',
        category: 'CLIMATISE',
        total_seats: 70,
        current_station_id: 'st-ouaga-01',
        status: 'IN_SERVICE',
        has_wifi: false,
        has_ac: true,
        has_usb_ports: true,
      },
      {
        id: 'veh-std-03',
        plate_number: '11-LL-1204-BF',
        brand: 'Marcopolo',
        model: 'Paradiso G7',
        category: 'STANDARD',
        total_seats: 70,
        current_station_id: 'st-bobo-01',
        status: 'IN_SERVICE',
        has_wifi: false,
        has_ac: false,
        has_usb_ports: false,
      },
    ];

    // 3. GÉNÉRATION DES 70 SIÈGES DU CAR VIP (veh-vip-01)
    // 17 rangées de 4 sièges + 1 banquette arrière de 2 = 70 places
    this.seats = [];
    for (let s = 1; s <= 70; s++) {
      const row = Math.floor((s - 1) / 4) + 1;
      const col = (s - 1) % 4; // 0,1: Gauche (A, B) | 2,3: Droite (C, D)
      const colLetter = ['A', 'B', 'C', 'D'][col];
      const tier = s <= 12 ? 'VIP' : s >= 69 ? 'CREW_RESERVED' : 'STANDARD';

      this.seats.push({
        id: `seat-${s}`,
        vehicle_id: 'veh-vip-01',
        seat_number: s,
        seat_label: `${row}${colLetter}`,
        tier,
        row_index: row,
        col_index: col,
        is_active: true,
      });
    }

    // 4. LIGNES INTERURBAINES (ROUTES)
    this.routes = [
      {
        id: 'route-ouaga-bobo',
        origin_station_id: 'st-ouaga-01',
        destination_station_id: 'st-bobo-01',
        distance_km: 365,
        estimated_duration_minutes: 330,
        base_price_standard: 12000,
        base_price_vip: 25000,
        is_active: true,
      },
      {
        id: 'route-bobo-ouaga',
        origin_station_id: 'st-bobo-01',
        destination_station_id: 'st-ouaga-01',
        distance_km: 365,
        estimated_duration_minutes: 330,
        base_price_standard: 12000,
        base_price_vip: 25000,
        is_active: true,
      },
      {
        id: 'route-ouaga-koudougou',
        origin_station_id: 'st-ouaga-01',
        destination_station_id: 'st-koudougou-01',
        distance_km: 100,
        estimated_duration_minutes: 90,
        base_price_standard: 3000,
        base_price_vip: 4500,
        is_active: true,
      },
      {
        id: 'route-ouaga-ouahigouya',
        origin_station_id: 'st-ouaga-01',
        destination_station_id: 'st-ouahigouya-01',
        distance_km: 185,
        estimated_duration_minutes: 160,
        base_price_standard: 6000,
        base_price_vip: 9000,
        is_active: true,
      },
    ];

    // 5. VOYAGES PROGRAMMÉS (TRIPS)
    const today = new Date().toISOString().split('T')[0];
    this.trips = [
      {
        id: 'trip-01',
        trip_code: 'TRIP-OUA-BOB-1630',
        route_id: 'route-ouaga-bobo',
        vehicle_id: 'veh-vip-01',
        driver_id: 'drv-01',
        departure_time: `${today}T16:30:00Z`,
        estimated_arrival_time: `${today}T22:00:00Z`,
        price_standard: 12000,
        price_vip: 25000,
        status: 'SCHEDULED',
        boarding_gate: 'Quai VIP 1',
        delay_minutes: 0,
      },
      {
        id: 'trip-02',
        trip_code: 'TRIP-OUA-BOB-0700',
        route_id: 'route-ouaga-bobo',
        vehicle_id: 'veh-clim-02',
        driver_id: 'drv-01',
        departure_time: `${today}T07:00:00Z`,
        estimated_arrival_time: `${today}T12:30:00Z`,
        price_standard: 12000,
        price_vip: 25000,
        status: 'SCHEDULED',
        boarding_gate: 'Quai 2',
        delay_minutes: 0,
      },
      {
        id: 'trip-03',
        trip_code: 'TRIP-OUA-KDG-1000',
        route_id: 'route-ouaga-koudougou',
        vehicle_id: 'veh-std-03',
        driver_id: 'drv-01',
        departure_time: `${today}T10:00:00Z`,
        estimated_arrival_time: `${today}T11:30:00Z`,
        price_standard: 3000,
        price_vip: 4500,
        status: 'SCHEDULED',
        boarding_gate: 'Quai 3',
        delay_minutes: 0,
      },
      {
        id: 'trip-04',
        trip_code: 'TRIP-OUA-OHG-1400',
        route_id: 'route-ouaga-ouahigouya',
        vehicle_id: 'veh-clim-02',
        driver_id: 'drv-01',
        departure_time: `${today}T14:00:00Z`,
        estimated_arrival_time: `${today}T16:40:00Z`,
        price_standard: 6000,
        price_vip: 9000,
        status: 'SCHEDULED',
        boarding_gate: 'Quai 4',
        delay_minutes: 0,
      },
    ];

    // 6. UTILISATEURS DE DÉMONSTRATION
    this.users = [
      {
        id: 'usr-client-01',
        phone_number: '+22676543210',
        first_name: 'Jean-Paul',
        last_name: 'Yaméogo',
        email: 'yameogo.voyage@example.com',
        role: 'CLIENT',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-agent-01',
        phone_number: '+22670000003',
        first_name: 'Ibrahim',
        last_name: 'Sawadogo',
        email: 'ibrahim.controleur@tsr.bf',
        role: 'AGENT_CONTROLE',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr-admin-01',
        phone_number: '+22670000001',
        first_name: 'Salif',
        last_name: 'Ouedraogo',
        email: 'direction@tsr-transport.bf',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 7. COMPTE FIDÉLITÉ (Jean-Paul Yaméogo a déjà 9 voyages réalisés !)
    this.loyaltyAccounts = [
      {
        id: 'loy-01',
        user_id: 'usr-client-01',
        phone_number: '+22676543210',
        completed_trips_count: 9,
        eligible_for_discount: false,
        discount_rate_percentage: 50,
        total_lifetime_trips: 9,
      },
    ];

    // 8. RÉSERVATION & BILLET INITIAL EXISTANT SUR SIÈGE 12 (Exemple du cahier des charges)
    this.bookings = [
      {
        id: 'bk-demo-01',
        booking_reference: 'TSR-BK-2026-004587',
        customer_id: 'usr-client-01',
        channel: 'MOBILE_APP',
        trip_id: 'trip-01',
        is_third_party: false,
        purchaser_phone: '+22676543210',
        purchaser_name: 'Jean-Paul Yaméogo',
        subtotal_amount: 25000,
        options_amount: 0,
        discount_amount: 0,
        total_amount: 25100,
        insurance_opt_in: true,
        insurance_fee: 100,
        status: 'CONFIRMED',
        payment_expires_at: `${today}T16:00:00Z`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.bookingItems = [
      {
        id: 'bki-01',
        booking_id: 'bk-demo-01',
        seat_number: 12,
        seat_tier: 'VIP',
        unit_price: 25000,
        luggage_extra_weight_kg: 0,
        has_bicycle: false,
        has_motorcycle: false,
        item_options_fee: 0,
      },
    ];

    this.passengers = [
      {
        id: 'pax-01',
        booking_id: 'bk-demo-01',
        seat_number: 12,
        first_name: 'Jean-Paul',
        last_name: 'Yaméogo',
        phone_number: '+22676543210',
        id_card_number: 'B12938475',
        is_minor: false,
      },
    ];

    this.tickets = [
      {
        id: 'tkt-01',
        ticket_number: 'TSR-2026-4587',
        booking_id: 'bk-demo-01',
        trip_id: 'trip-01',
        passenger_id: 'pax-01',
        seat_number: 12,
        amount_paid: 25000,
        status: 'VALID',
        issued_at: new Date().toISOString(),
      },
    ];

    this.qrCodes = [
      {
        id: 'qr-01',
        ticket_id: 'tkt-01',
        token_signature: '9b8e2f81a7d65c3b12984028374920acdef1827409281740abcedf8172948201',
        nonce: 'NONCE-TSR-2026-98124',
        payload: {
          ticketNumber: 'TSR-2026-4587',
          passenger: 'Jean-Paul Yaméogo',
          trip: 'TRIP-OUA-BOB-1630',
          seat: 12,
          origin: 'Ouagadougou',
          destination: 'Bobo-Dioulasso',
          date: today,
          time: '16:30',
          category: 'VIP',
          amount: 25000,
        },
        expires_at: `${today}T23:59:59Z`,
        is_revoked: false,
      },
    ];

    // Sièges occupés de test pour donner de la vie au car (ex: sièges 1, 2, 5 déjà vendus)
    const extraSeats = [1, 2, 5, 23, 24];
    extraSeats.forEach((seatNum, idx) => {
      this.tickets.push({
        id: `tkt-extra-${seatNum}`,
        ticket_number: `TSR-2026-00${seatNum + 100}`,
        booking_id: 'bk-demo-01',
        trip_id: 'trip-01',
        passenger_id: 'pax-01',
        seat_number: seatNum,
        amount_paid: seatNum <= 12 ? 25000 : 12000,
        status: 'VALID',
        issued_at: new Date().toISOString(),
      });
    });

    // 9. UN VERROU TEMPORAIRE DE TEST SUR LE SIÈGE 15 (simulant un utilisateur concurrent)
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 8 * 60 * 1000); // expire dans 8 minutes
    this.seatLocks.push({
      id: 'lock-test-15',
      trip_id: 'trip-01',
      seat_number: 15,
      session_token: 'SESSION-CONCURRENT-CLIENT-42',
      locked_at: now.toISOString(),
      expires_at: lockExpiry.toISOString(),
    });
  }

  // Nettoyage des verrous expirés
  public purgeExpiredLocks() {
    const now = new Date().getTime();
    this.seatLocks = this.seatLocks.filter((l) => new Date(l.expires_at).getTime() > now);
  }
}

export const db = new MockDatabase();

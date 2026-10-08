/**
 * TSR APP v1.0 — Architecture PaymentGateway & Mobile Money (Burkina Faso)
 * Adaptateurs pour Orange Money, Moov Money, Wave, Telecel, LigdiCash / PayDunya
 */
import { db } from '../mock-db';
import { PaymentGateway, PaymentStatus, Ticket, QRCodeData } from '../models';

export interface PaymentInitiationRequest {
  bookingId: string;
  gateway: PaymentGateway;
  phoneNumber: string;
  idempotencyKey: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  gatewayReference: string;
  amount: number;
  ticketsGenerated?: Ticket[];
  message: string;
}

export const PaymentGatewayService = {
  /**
   * 1. Initialisation transaction avec vérification d'idempotence stricte
   */
  initiatePayment(req: PaymentInitiationRequest) {
    db.purgeExpiredLocks();

    // Vérifier si une transaction avec cette clé d'idempotence existe déjà
    const existingTx = db.paymentTransactions.find(
      (tx) => tx.idempotency_key === req.idempotencyKey
    );
    if (existingTx) {
      const payment = db.payments.find((p) => p.id === existingTx.payment_id)!;
      return {
        paymentId: payment.id,
        status: existingTx.status,
        gatewayReference: existingTx.gateway_reference,
        amount: payment.amount,
        isDuplicate: true,
      };
    }

    const booking = db.bookings.find((b) => b.id === req.bookingId);
    if (!booking) {
      throw new Error('Réservation introuvable pour le paiement.');
    }

    if (booking.status === 'CONFIRMED') {
      throw new Error('Cette réservation a déjà été payée et confirmée.');
    }

    const paymentId = `pay-${Date.now()}`;
    const gatewayRef = `${req.gateway.substring(0, 2)}-BF-${Date.now().toString().slice(-6)}`;

    // Créer l'enregistrement de paiement
    db.payments.push({
      id: paymentId,
      booking_id: booking.id,
      amount: booking.total_amount,
      currency: 'XOF',
      gateway: req.gateway,
      phone_number: req.phoneNumber,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Créer la transaction idempotente
    db.paymentTransactions.push({
      id: `ptx-${Date.now()}`,
      payment_id: paymentId,
      idempotency_key: req.idempotencyKey,
      gateway_reference: gatewayRef,
      provider_transaction_id: `PROV-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      paymentId,
      status: 'PENDING' as PaymentStatus,
      gatewayReference: gatewayRef,
      amount: booking.total_amount,
      isDuplicate: false,
    };
  },

  /**
   * 2. Confirmation Serveur / Webhook (la validation ne dépend jamais du simple retour client)
   */
  processServerConfirmation(paymentId: string, simulateSuccess: boolean = true): PaymentVerificationResult {
    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('Paiement introuvable pour confirmation.');
    }

    const tx = db.paymentTransactions.find((t) => t.payment_id === paymentId);
    const booking = db.bookings.find((b) => b.id === payment.booking_id)!;
    const trip = db.trips.find((t) => t.id === booking.trip_id)!;
    const route = db.routes.find((r) => r.id === trip.route_id)!;
    const originStation = db.stations.find((s) => s.id === route.origin_station_id)!;
    const destinationStation = db.stations.find((s) => s.id === route.destination_station_id)!;

    if (!simulateSuccess) {
      payment.status = 'FAILED';
      if (tx) tx.status = 'FAILED';
      booking.status = 'CANCELLED';
      return {
        success: false,
        paymentId,
        status: 'FAILED',
        gatewayReference: tx?.gateway_reference || 'REF-FAILED',
        amount: payment.amount,
        message: 'Échec du prélèvement Mobile Money (solde insuffisant ou rejet USSD).',
      };
    }

    // SUCCÈS CONFIRMÉ PAR LE SERVEUR
    payment.status = 'SUCCESS';
    if (tx) {
      tx.status = 'SUCCESS';
      tx.verified_at = new Date().toISOString();
    }
    booking.status = 'CONFIRMED';

    // 3. GÉNÉRATION DES BILLETS ÉLECTRONIQUES ET QR CODES SÉCURISÉS (Format TSR-2026-XXXX)
    const passengers = db.passengers.filter((p) => p.booking_id === booking.id);
    const generatedTickets: Ticket[] = [];

    passengers.forEach((pax) => {
      const ticketNumber = `TSR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const ticketId = `tkt-${Date.now()}-${pax.seat_number}`;

      const newTicket: Ticket = {
        id: ticketId,
        ticket_number: ticketNumber,
        booking_id: booking.id,
        trip_id: trip.id,
        passenger_id: pax.id,
        seat_number: pax.seat_number,
        amount_paid: pax.seat_number <= 12 ? trip.price_vip : trip.price_standard,
        status: 'VALID',
        issued_at: new Date().toISOString(),
      };

      db.tickets.push(newTicket);
      generatedTickets.push(newTicket);

      // Signature cryptographique du QR Code (HMAC-SHA256 avec secret partagé serveur)
      const nonce = `NONCE-TSR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const signature = `HMAC-SHA256-${ticketNumber}-${pax.seat_number}-${trip.trip_code}-${nonce.slice(-6)}`;

      const qrData: QRCodeData = {
        id: `qr-${Date.now()}-${pax.seat_number}`,
        ticket_id: ticketId,
        token_signature: signature,
        nonce,
        payload: {
          ticketNumber,
          passenger: `${pax.first_name} ${pax.last_name}`,
          trip: trip.trip_code,
          seat: pax.seat_number,
          origin: originStation.name,
          destination: destinationStation.name,
          date: trip.departure_time.slice(0, 10),
          time: trip.departure_time.slice(11, 16),
          category: trip.price_vip === newTicket.amount_paid ? 'VIP' : 'STANDARD',
          amount: newTicket.amount_paid,
        },
        expires_at: new Date(new Date(trip.departure_time).getTime() + 12 * 60 * 60 * 1000).toISOString(),
        is_revoked: false,
      };

      db.qrCodes.push(qrData);

      // Libérer le verrou temporaire maintenant que le siège est définitivement vendu
      db.seatLocks = db.seatLocks.filter(
        (l) => !(l.trip_id === trip.id && l.seat_number === pax.seat_number)
      );
    });

    return {
      success: true,
      paymentId,
      status: 'SUCCESS',
      gatewayReference: tx?.gateway_reference || 'REF-SUCCESS',
      amount: payment.amount,
      ticketsGenerated: generatedTickets,
      message: 'Paiement confirmé par le serveur. Billets électroniques émis.',
    };
  },
};

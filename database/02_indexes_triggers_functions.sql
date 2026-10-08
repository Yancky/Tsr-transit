-- =====================================================================
-- TSR APP v1.0 — INDEX, FONCTIONS ET TRIGGERS POSTGRESQL
-- Société de Transport TSR Transport (Burkina Faso)
-- =====================================================================

-- =====================================================================
-- 1. INDEX DE PERFORMANCE ET CONTRAINTES AVANCÉES
-- =====================================================================

-- Index de recherche rapide des voyages (Gare départ -> Gare arrivée + Date)
CREATE INDEX IF NOT EXISTS idx_trips_route_departure 
ON trips (route_id, departure_time, status);

CREATE INDEX IF NOT EXISTS idx_trips_status 
ON trips (status);

-- Index pour la recherche des gares actives
CREATE INDEX IF NOT EXISTS idx_stations_city_active 
ON stations (city_id, is_active);

-- Index pour la recherche des sièges par car
CREATE INDEX IF NOT EXISTS idx_seats_vehicle 
ON seats (vehicle_id, seat_number);

-- Index pour les verrous de sièges temporaires
CREATE INDEX IF NOT EXISTS idx_seat_locks_trip_expires 
ON seat_locks (trip_id, expires_at);

-- Index sur les réservations et statuts
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status 
ON bookings (customer_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_reference 
ON bookings (booking_reference);

CREATE INDEX IF NOT EXISTS idx_bookings_trip 
ON bookings (trip_id);

-- Index sur les paiements et idempotence
CREATE INDEX IF NOT EXISTS idx_payment_tx_idempotency 
ON payment_transactions (idempotency_key);

CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway_ref 
ON payment_transactions (gateway_reference);

-- Index sur les billets et QR codes
CREATE INDEX IF NOT EXISTS idx_tickets_number 
ON tickets (ticket_number);

CREATE INDEX IF NOT EXISTS idx_tickets_trip_status 
ON tickets (trip_id, status);

CREATE INDEX IF NOT EXISTS idx_qr_codes_ticket 
ON qr_codes (ticket_id);

-- Index pour les scans de contrôle et anti-fraude
CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket 
ON ticket_scans (ticket_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_scans_agent 
ON ticket_scans (agent_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status_sev 
ON fraud_alerts (status, severity, created_at DESC);

-- Index colis et suivi
CREATE INDEX IF NOT EXISTS idx_packages_tracking 
ON packages (tracking_code);

CREATE INDEX IF NOT EXISTS idx_packages_status 
ON packages (status);

-- =====================================================================
-- 2. FONCTIONS MÉTIER SPÉCIFIQUES TSR TRANSPORT
-- =====================================================================

-- 2.1. Mise à jour automatique de la colonne updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2.2. Fonction de verrouillage atomique de siège (empêche la vente simultanée)
CREATE OR REPLACE FUNCTION lock_seat(
    p_trip_id UUID,
    p_seat_number INT,
    p_user_id UUID,
    p_session_token VARCHAR(255),
    p_duration_minutes INT DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
    v_already_booked BOOLEAN;
    v_locked_record RECORD;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 1. Nettoyer les verrous expirés pour ce trajet
    DELETE FROM seat_locks 
    WHERE trip_id = p_trip_id AND expires_at <= NOW();

    -- 2. Vérifier si le siège est déjà définitivement vendu
    SELECT EXISTS (
        SELECT 1 FROM tickets 
        WHERE trip_id = p_trip_id 
          AND seat_number = p_seat_number 
          AND status IN ('VALID', 'BOARDED')
    ) INTO v_already_booked;

    IF v_already_booked THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'SEAT_ALREADY_BOOKED',
            'message', 'Ce siège est déjà définitivement vendu.'
        );
    END IF;

    -- 3. Vérifier si le siège est verrouillé par un autre client
    SELECT * INTO v_locked_record 
    FROM seat_locks 
    WHERE trip_id = p_trip_id AND seat_number = p_seat_number;

    IF FOUND THEN
        IF v_locked_record.session_token <> p_session_token THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'SEAT_CURRENTLY_LOCKED',
                'message', 'Ce siège est en cours de sélection par un autre voyageur.',
                'expires_at', v_locked_record.expires_at
            );
        ELSE
            -- Prolonger le verrou du même utilisateur
            v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
            UPDATE seat_locks 
            SET expires_at = v_expires_at 
            WHERE id = v_locked_record.id;
            
            RETURN jsonb_build_object(
                'success', true, 
                'locked', true, 
                'expires_at', v_expires_at
            );
        END IF;
    END IF;

    -- 4. Poser le verrou
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
    INSERT INTO seat_locks (trip_id, seat_number, locked_by_user_id, session_token, expires_at)
    VALUES (p_trip_id, p_seat_number, p_user_id, p_session_token, v_expires_at);

    RETURN jsonb_build_object(
        'success', true, 
        'locked', true, 
        'seat_number', p_seat_number,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql;

-- 2.3. Fonction de validation anti-fraude et d'embarquement d'un billet
CREATE OR REPLACE FUNCTION validate_and_board_ticket(
    p_ticket_number VARCHAR(35),
    p_trip_id UUID,
    p_agent_id UUID,
    p_station_id UUID,
    p_device_id VARCHAR(100),
    p_raw_payload TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_ticket RECORD;
    v_scan_result scan_result_enum;
    v_passenger RECORD;
BEGIN
    -- Rechercher le billet
    SELECT * INTO v_ticket 
    FROM tickets 
    WHERE ticket_number = p_ticket_number;

    -- Cas 1: Billet inexistant
    IF NOT FOUND THEN
        INSERT INTO ticket_scans (agent_id, station_id, device_id, raw_payload, result, details)
        VALUES (p_agent_id, p_station_id, p_device_id, p_raw_payload, 'INVALID_SIGNATURE', 
                jsonb_build_object('reason', 'Numéro de billet introuvable'));
        
        -- Déclencher une alerte fraude
        INSERT INTO fraud_alerts (alert_type, severity, agent_id, station_id, details)
        VALUES ('UNKNOWN_TICKET_SCANNED', 'HIGH', p_agent_id, p_station_id, 
                jsonb_build_object('ticket_number', p_ticket_number, 'device_id', p_device_id));

        RETURN jsonb_build_object(
            'success', false,
            'result', 'INVALID_SIGNATURE',
            'message', 'BILLET INVALIDE : Numéro inexistant ou faux ticket.'
        );
    END IF;

    -- Récupérer le passager
    SELECT * INTO v_passenger FROM passengers WHERE id = v_ticket.passenger_id;

    -- Cas 2: Billet déjà utilisé (TENTATIVE DE DOUBLE EMBARQUEMENT)
    IF v_ticket.status = 'BOARDED' THEN
        v_scan_result := 'ALREADY_USED';
        
        INSERT INTO ticket_scans (ticket_id, agent_id, station_id, device_id, raw_payload, result, details)
        VALUES (v_ticket.id, p_agent_id, p_station_id, p_device_id, p_raw_payload, v_scan_result, 
                jsonb_build_object('already_boarded_at', v_ticket.boarded_at));

        -- Alerte fraude critique immédiate
        INSERT INTO fraud_alerts (alert_type, severity, ticket_id, agent_id, station_id, details)
        VALUES ('DUPLICATE_SCAN_ATTEMPT', 'CRITICAL', v_ticket.id, p_agent_id, p_station_id, 
                jsonb_build_object(
                    'ticket_number', p_ticket_number,
                    'passenger_name', v_passenger.first_name || ' ' || v_passenger.last_name,
                    'first_boarded_at', v_ticket.boarded_at,
                    'attempted_again_at', NOW()
                ));

        RETURN jsonb_build_object(
            'success', false,
            'result', 'ALREADY_USED',
            'message', 'ATTENTION FRAUDE : Billet déjà utilisé pour l''embarquement !',
            'first_boarded_at', v_ticket.boarded_at
        );
    END IF;

    -- Cas 3: Mauvais car ou mauvais voyage
    IF v_ticket.trip_id <> p_trip_id THEN
        v_scan_result := 'WRONG_TRIP';
        INSERT INTO ticket_scans (ticket_id, agent_id, station_id, device_id, raw_payload, result, details)
        VALUES (v_ticket.id, p_agent_id, p_station_id, p_device_id, p_raw_payload, v_scan_result, 
                jsonb_build_object('expected_trip', p_trip_id, 'ticket_trip', v_ticket.trip_id));

        RETURN jsonb_build_object(
            'success', false,
            'result', 'WRONG_TRIP',
            'message', 'MAUVAIS CAR : Ce billet n''est pas assigné à ce départ.',
            'passenger_name', v_passenger.first_name || ' ' || v_passenger.last_name,
            'assigned_seat', v_ticket.seat_number
        );
    END IF;

    -- Cas 4: Billet annulé ou remboursé
    IF v_ticket.status IN ('CANCELLED', 'REFUNDED') THEN
        v_scan_result := 'CANCELLED_TICKET';
        INSERT INTO ticket_scans (ticket_id, agent_id, station_id, device_id, raw_payload, result, details)
        VALUES (v_ticket.id, p_agent_id, p_station_id, p_device_id, p_raw_payload, v_scan_result, 
                jsonb_build_object('status', v_ticket.status));

        RETURN jsonb_build_object(
            'success', false,
            'result', 'CANCELLED_TICKET',
            'message', 'BILLET ANNULÉ OU REMBOURSÉ : Accès refusé.'
        );
    END IF;

    -- Cas 5: VALIDATION SUCCÈS — Enregistrement de l'embarquement
    UPDATE tickets 
    SET status = 'BOARDED',
        boarded_at = NOW(),
        boarded_by_agent_id = p_agent_id,
        boarding_station_id = p_station_id,
        updated_at = NOW()
    WHERE id = v_ticket.id;

    INSERT INTO boarding_records (trip_id, ticket_id, passenger_id, agent_id, seat_number, boarding_status, boarded_at, device_id)
    VALUES (p_trip_id, v_ticket.id, v_ticket.passenger_id, p_agent_id, v_ticket.seat_number, 'BOARDED', NOW(), p_device_id);

    INSERT INTO ticket_scans (ticket_id, agent_id, station_id, device_id, raw_payload, result)
    VALUES (v_ticket.id, p_agent_id, p_station_id, p_device_id, p_raw_payload, 'VALID_ACCEPTED');

    RETURN jsonb_build_object(
        'success', true,
        'result', 'VALID_ACCEPTED',
        'message', 'BILLET VALIDE : Embarquement autorisé',
        'passenger_name', v_passenger.first_name || ' ' || v_passenger.last_name,
        'seat_number', v_ticket.seat_number,
        'phone', v_passenger.phone_number
    );
END;
$$ LANGUAGE plpgsql;

-- 2.4. Fonction d'annulation et remboursement avec retenue de 10%
CREATE OR REPLACE FUNCTION process_refund_with_penalty(
    p_ticket_id UUID,
    p_reason TEXT,
    p_requested_by_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_ticket RECORD;
    v_penalty_rate NUMERIC := 10.00;
    v_penalty_amt NUMERIC;
    v_refund_net NUMERIC;
    v_refund_id UUID;
BEGIN
    SELECT * INTO v_ticket FROM tickets WHERE id = p_ticket_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'TICKET_NOT_FOUND');
    END IF;

    IF v_ticket.status <> 'VALID' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS', 'message', 'Seul un billet valide non utilisé peut être remboursé.');
    END IF;

    -- Calcul de la retenue de 10%
    v_penalty_amt := ROUND(v_ticket.amount_paid * (v_penalty_rate / 100.0), 2);
    v_refund_net := v_ticket.amount_paid - v_penalty_amt;

    -- Créer la transaction de remboursement
    INSERT INTO refunds (
        booking_id, ticket_id, requested_by_user_id,
        original_amount, penalty_rate_percentage, penalty_amount, refunded_net_amount,
        reason, status, processed_at
    ) VALUES (
        v_ticket.booking_id, v_ticket.id, p_requested_by_user_id,
        v_ticket.amount_paid, v_penalty_rate, v_penalty_amt, v_refund_net,
        p_reason, 'APPROVED', NOW()
    ) RETURNING id INTO v_refund_id;

    -- Mettre à jour le statut du billet
    UPDATE tickets 
    SET status = 'CANCELLED', updated_at = NOW() 
    WHERE id = p_ticket_id;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'original_amount', v_ticket.amount_paid,
        'penalty_percentage', v_penalty_rate,
        'penalty_amount', v_penalty_amt,
        'net_refund_amount', v_refund_net,
        'currency', 'XOF'
    );
END;
$$ LANGUAGE plpgsql;

-- 2.5. Fonction de calcul du programme de fidélité (10 voyages = 11e à -50%)
CREATE OR REPLACE FUNCTION update_loyalty_on_trip_completion(
    p_user_id UUID,
    p_ticket_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_account RECORD;
    v_new_count INT;
    v_eligible BOOLEAN;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN;
    END IF;

    SELECT * INTO v_account FROM loyalty_accounts WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO loyalty_accounts (user_id, phone_number, completed_trips_count, total_lifetime_trips, eligible_for_discount)
        SELECT u.id, u.phone_number, 1, 1, FALSE
        FROM users u WHERE u.id = p_user_id
        RETURNING * INTO v_account;
    ELSE
        v_new_count := v_account.completed_trips_count + 1;
        -- Règle: 10 voyages réalisés -> éligible à 50% sur le suivant
        v_eligible := (v_new_count >= 10);

        UPDATE loyalty_accounts 
        SET completed_trips_count = v_new_count,
            total_lifetime_trips = total_lifetime_trips + 1,
            eligible_for_discount = v_eligible,
            updated_at = NOW()
        WHERE id = v_account.id;

        INSERT INTO loyalty_transactions (loyalty_account_id, ticket_id, action, trips_delta, balance_after, notes)
        VALUES (v_account.id, p_ticket_id, 'TRIP_COMPLETED', 1, v_new_count, 'Voyage TSR effectué et validé');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 3. TRIGGERS AUTOMATIQUES
-- =====================================================================

CREATE OR REPLACE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

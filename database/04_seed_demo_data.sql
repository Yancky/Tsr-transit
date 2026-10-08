-- =====================================================================
-- TSR APP v1.0 — DONNÉES DE DÉMONSTRATION COMPLÈTES (BURKINA FASO)
-- Société de Transport TSR Transport
-- =====================================================================

-- 1. VILLES DU BURKINA FASO
INSERT INTO cities (id, name, region, country) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ouagadougou', 'Centre', 'Burkina Faso'),
('a0000000-0000-0000-0000-000000000002', 'Bobo-Dioulasso', 'Hauts-Bassins', 'Burkina Faso'),
('a0000000-0000-0000-0000-000000000003', 'Koudougou', 'Centre-Ouest', 'Burkina Faso'),
('a0000000-0000-0000-0000-000000000004', 'Ouahigouya', 'Nord', 'Burkina Faso')
ON CONFLICT (id) DO NOTHING;

-- 2. GARES TSR TRANSPORT
INSERT INTO stations (id, city_id, name, code, address, latitude, longitude, phone, opening_time, closing_time, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Gare Centrale TSR Ouagadougou', 'GARE-OUA-01', 'Avenue Bassawarga, Secteur 4, Ouagadougou', 12.3686, -1.5271, '+226 25 31 00 11', '05:00:00', '23:00:00', TRUE),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Gare Principale TSR Bobo-Dioulasso', 'GARE-BOB-01', 'Boulevard de la Révolution, Secteur 1, Bobo-Dioulasso', 11.1783, -4.2974, '+226 20 97 22 44', '05:00:00', '23:00:00', TRUE),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Gare TSR Koudougou', 'GARE-KDG-01', 'Route Nationale 1, Koudougou', 12.2531, -2.3622, '+226 25 44 12 80', '06:00:00', '21:00:00', TRUE),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Gare TSR Ouahigouya', 'GARE-OHG-01', 'Avenue du 11 Décembre, Ouahigouya', 13.5828, -2.4216, '+226 24 55 03 19', '06:00:00', '21:00:00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. UTILISATEURS (Direction, Agents et Clients)
INSERT INTO users (id, phone_number, first_name, last_name, email, role, status) VALUES
-- Administrateur & Gérant
('c0000000-0000-0000-0000-000000000001', '+22670000001', 'Salif', 'Ouedraogo', 'direction@tsr-transport.bf', 'SUPER_ADMIN', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000002', '+22670000002', 'Aminata', 'Kaboré', 'compta@tsr-transport.bf', 'COMPTABLE', 'ACTIVE'),
-- Agents Ouagadougou
('c0000000-0000-0000-0000-000000000003', '+22670000003', 'Ibrahim', 'Sawadogo', 'ibrahim.controleur@tsr.bf', 'AGENT_CONTROLE', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000004', '+22670000004', 'Fatoumata', 'Traoré', 'fatou.guichet@tsr.bf', 'GUICHETIER', 'ACTIVE'),
-- Agents Bobo
('c0000000-0000-0000-0000-000000000005', '+22670000005', 'Karim', 'Sanou', 'karim.bobo@tsr.bf', 'AGENT_CONTROLE', 'ACTIVE'),
-- Chauffeurs
('c0000000-0000-0000-0000-000000000006', '+22670000006', 'Moussa', 'Zongo', 'chauffeur.zongo@tsr.bf', 'CHAUFFEUR', 'ACTIVE'),
-- Clients voyageurs
('c0000000-0000-0000-0000-000000000007', '+22676543210', 'Jean-Paul', 'Yaméogo', 'yameogo.voyage@example.com', 'CLIENT', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000008', '+22678112233', 'Aïssata', 'Diallo', 'aissata.d@example.com', 'CLIENT', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. AGENTS AFFILIÉS AUX GARES
INSERT INTO agents (id, user_id, station_id, matricule, counter_code, role, is_active) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'AGT-OUA-01', 'SCANNER-PORT-A', 'AGENT_CONTROLE', TRUE),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'GCT-OUA-02', 'GUICHET-01', 'GUICHETIER', TRUE),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'AGT-BOB-01', 'SCANNER-PORT-B', 'AGENT_CONTROLE', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. CHAUFFEURS
INSERT INTO drivers (id, user_id, license_number, full_name, phone, hired_at, is_active) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000006', 'PERMIS-BF-D-884920', 'Moussa Zongo', '+22670000006', '2021-03-15', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. FLOTTE DE CARS TSR (70 PLACES)
INSERT INTO vehicles (id, plate_number, brand, model, category, total_seats, current_station_id, status, has_wifi, has_ac, has_usb_ports) VALUES
('f0000000-0000-0000-0000-000000000001', '11-JJ-4567-BF', 'Yutong', 'ZK6122HD Luxury', 'VIP', 70, 'b0000000-0000-0000-0000-000000000001', 'IN_SERVICE', TRUE, TRUE, TRUE),
('f0000000-0000-0000-0000-000000000002', '11-KK-9821-BF', 'Yutong', 'ZK6120 Cruiser', 'CLIMATISE', 70, 'b0000000-0000-0000-0000-000000000001', 'IN_SERVICE', FALSE, TRUE, TRUE),
('f0000000-0000-0000-0000-000000000003', '11-LL-1204-BF', 'Marcopolo', 'Paradiso G7', 'STANDARD', 70, 'b0000000-0000-0000-0000-000000000002', 'IN_SERVICE', FALSE, TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. DISPOSITION DES SIÈGES DU CAR VIP (Exemple 70 places : 1 à 70)
-- 18 rangées de 4 sièges (2 à gauche, allée, 2 à droite) + 1 banquette arrière de 5
DO $$
DECLARE
    v_seat INT;
    v_row INT;
    v_col INT;
    v_tier seat_tier_enum;
    v_label VARCHAR(10);
BEGIN
    FOR v_seat IN 1..70 LOOP
        v_row := ((v_seat - 1) / 4) + 1;
        v_col := (v_seat - 1) % 4;
        
        -- Sièges 1 à 12 = VIP (avant du car)
        IF v_seat <= 12 THEN
            v_tier := 'VIP';
        ELSIF v_seat IN (69, 70) THEN
            v_tier := 'CREW_RESERVED'; -- réservé équipage
        ELSE
            v_tier := 'STANDARD';
        END IF;

        v_label := v_row || CHR(65 + v_col); -- 1A, 1B, 1C, 1D...

        INSERT INTO seats (vehicle_id, seat_number, seat_label, tier, row_index, col_index)
        VALUES ('f0000000-0000-0000-0000-000000000001', v_seat, v_label, v_tier, v_row, v_col)
        ON CONFLICT (vehicle_id, seat_number) DO NOTHING;
    END LOOP;
END $$;

-- 8. LIGNES INTERURBAINES (ROUTES)
INSERT INTO routes (id, origin_station_id, destination_station_id, distance_km, estimated_duration_minutes, base_price_standard, base_price_vip, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 365.0, 330, 12000.00, 25000.00, TRUE), -- Ouaga -> Bobo
('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 365.0, 330, 12000.00, 25000.00, TRUE), -- Bobo -> Ouaga
('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 100.0, 90, 3000.00, 4500.00, TRUE),     -- Ouaga -> Koudougou
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 185.0, 160, 6000.00, 9000.00, TRUE)     -- Ouaga -> Ouahigouya
ON CONFLICT (id) DO NOTHING;

-- 9. VOYAGES PROGRAMMÉS (TRIPS)
INSERT INTO trips (id, trip_code, route_id, vehicle_id, driver_id, departure_time, estimated_arrival_time, price_standard, price_vip, status, boarding_gate) VALUES
('20000000-0000-0000-0000-000000000001', 'TRIP-OUA-BOB-1630', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 
 '2026-10-12 16:30:00+00', '2026-10-12 22:00:00+00', 12000.00, 25000.00, 'SCHEDULED', 'Quai VIP 1'),
('20000000-0000-0000-0000-000000000002', 'TRIP-OUA-BOB-0700', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 
 '2026-10-12 07:00:00+00', '2026-10-12 12:30:00+00', 12000.00, 25000.00, 'SCHEDULED', 'Quai 2')
ON CONFLICT (id) DO NOTHING;

-- 10. RÉSERVATION & BILLET TYPE EXEMPLAIRE DU CAHIER DES CHARGES (TSR-2026-4587)
INSERT INTO bookings (id, booking_reference, customer_id, channel, trip_id, purchaser_phone, purchaser_name, subtotal_amount, options_amount, discount_amount, total_amount, insurance_opt_in, insurance_fee, status, payment_expires_at) VALUES
('30000000-0000-0000-0000-000000000001', 'TSR-BK-2026-004587', 'c0000000-0000-0000-0000-000000000007', 'MOBILE_APP', '20000000-0000-0000-0000-000000000001', '+22676543210', 'Jean-Paul Yaméogo', 25000.00, 0.00, 0.00, 25100.00, TRUE, 100.00, 'CONFIRMED', '2026-10-12 16:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO passengers (id, booking_id, seat_number, first_name, last_name, phone_number, id_card_number) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 12, 'Jean-Paul', 'Yaméogo', '+22676543210', 'B12938475')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, booking_id, amount, currency, gateway, phone_number, status) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 25100.00, 'XOF', 'ORANGE_MONEY', '+22676543210', 'SUCCESS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_transactions (id, payment_id, idempotency_key, gateway_reference, provider_transaction_id, status, verified_at) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'IDEMP-OM-BF-20261012-098471', 'OM-BF-REF-88492048', 'TXN-ORANGE-994821', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO tickets (id, ticket_number, booking_id, trip_id, passenger_id, seat_number, amount_paid, status) VALUES
('70000000-0000-0000-0000-000000000001', 'TSR-2026-4587', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 12, 25000.00, 'VALID')
ON CONFLICT (id) DO NOTHING;

INSERT INTO qr_codes (id, ticket_id, token_signature, nonce, payload, expires_at, is_revoked) VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 
 '9b8e2f81a7d65c3b12984028374920acdef1827409281740abcedf8172948201', 
 'NONCE-TSR-2026-98124', 
 '{"ticketNumber":"TSR-2026-4587","passenger":"Jean-Paul Yaméogo","trip":"TRIP-OUA-BOB-1630","seat":12,"origin":"Ouagadougou","destination":"Bobo-Dioulasso","date":"2026-10-12","time":"16:30","category":"VIP","amount":25000}', 
 '2026-10-12 23:59:59+00', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 11. COLIS DE DÉMONSTRATION
INSERT INTO packages (id, tracking_code, origin_station_id, destination_station_id, assigned_trip_id, sender_name, sender_phone, recipient_name, recipient_phone, weight_kg, description, shipping_fee, pickup_pin_hash, status, registered_by_agent_id) VALUES
('90000000-0000-0000-0000-000000000001', 'TSR-COLIS-2026-10293', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 'Moussa Sanon', '+22670112233', 'Awa Traoré', '+22675998877', 15.50, 'Carton de pièces mécaniques et documents', 3500.00, 'crypt_pin_4821', 'ACCEPTED_AT_STATION', 'd0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 12. COMPTE FIDÉLITÉ (Exemple client ayant 9 voyages -> le 10e donne le 11e à -50%)
INSERT INTO loyalty_accounts (id, user_id, phone_number, completed_trips_count, eligible_for_discount, discount_rate_percentage, total_lifetime_trips) VALUES
('a1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', '+22676543210', 9, FALSE, 50.00, 9)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- TSR APP v1.0 — SCHEMA POSTGRESQL COMPLET (Burkina Faso Transport)
-- Société de Transport TSR Transport
-- =====================================================================

-- Extensions PostgreSQL recommandées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. GESTION DES UTILISATEURS, RÔLES ET PERMISSIONS (RBAC)
-- =====================================================================

CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN', 
    'ADMIN', 
    'GERANT', 
    'RESPONSABLE_GARE', 
    'COMPTABLE', 
    'SUPERVISEUR', 
    'GUICHETIER', 
    'AGENT_CONTROLE', 
    'CHAUFFEUR', 
    'CLIENT'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL UNIQUE, -- ex: '+22670123456'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'CLIENT',
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name user_role_enum NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- ex: 'tickets:scan', 'counter:sell', 'analytics:view'
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);

-- =====================================================================
-- 2. VILLES, GARES, VÉHICULES ET AGENTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'Burkina Faso',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL, -- ex: 'Gare Centrale de Ouagadougou'
    code VARCHAR(10) NOT NULL UNIQUE, -- ex: 'OUA-01'
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    phone VARCHAR(20),
    opening_time TIME NOT NULL DEFAULT '05:30:00',
    closing_time TIME NOT NULL DEFAULT '22:30:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE vehicle_category_enum AS ENUM ('STANDARD', 'VIP', 'CLIMATISE');
CREATE TYPE vehicle_status_enum AS ENUM ('IN_SERVICE', 'MAINTENANCE', 'RESERVE', 'RETIRED');

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number VARCHAR(20) NOT NULL UNIQUE, -- ex: '11-JJ-4567-BF'
    brand VARCHAR(50) NOT NULL DEFAULT 'Yutong',
    model VARCHAR(50) NOT NULL DEFAULT 'ZK6122HD',
    category vehicle_category_enum NOT NULL DEFAULT 'CLIMATISE',
    total_seats INT NOT NULL DEFAULT 70 CHECK (total_seats > 0),
    current_station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    status vehicle_status_enum NOT NULL DEFAULT 'IN_SERVICE',
    has_wifi BOOLEAN NOT NULL DEFAULT FALSE,
    has_ac BOOLEAN NOT NULL DEFAULT TRUE,
    has_usb_ports BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    matricule VARCHAR(30) NOT NULL UNIQUE, -- ex: 'AGT-OUA-001'
    counter_code VARCHAR(20), -- code du guichet de vente
    role user_role_enum NOT NULL CHECK (role IN ('AGENT_CONTROLE', 'GUICHETIER', 'SUPERVISEUR', 'RESPONSABLE_GARE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_device_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3. TRAJETS, VOYAGES (TRIPS) ET GESTION DES SIÈGES
-- =====================================================================

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    destination_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    distance_km NUMERIC(6, 1) NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    base_price_standard NUMERIC(10, 2) NOT NULL CHECK (base_price_standard > 0),
    base_price_vip NUMERIC(10, 2) NOT NULL CHECK (base_price_vip >= base_price_standard),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_diff_origin_dest CHECK (origin_station_id <> destination_station_id),
    UNIQUE (origin_station_id, destination_station_id)
);

CREATE TYPE trip_status_enum AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED');

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_code VARCHAR(30) NOT NULL UNIQUE, -- ex: 'TRIP-OUA-BOB-20261012-01'
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    price_standard NUMERIC(10, 2) NOT NULL,
    price_vip NUMERIC(10, 2) NOT NULL,
    status trip_status_enum NOT NULL DEFAULT 'SCHEDULED',
    boarding_gate VARCHAR(20) DEFAULT 'Quai 1',
    delay_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE seat_tier_enum AS ENUM ('STANDARD', 'VIP', 'CREW_RESERVED');
CREATE TYPE seat_status_enum AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED');

CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    seat_number INT NOT NULL CHECK (seat_number BETWEEN 1 AND 100),
    seat_label VARCHAR(10) NOT NULL, -- ex: '1A', '12B'
    tier seat_tier_enum NOT NULL DEFAULT 'STANDARD',
    row_index INT NOT NULL,
    col_index INT NOT NULL, -- 0, 1 (gauche), 2 (allée), 3, 4 (droite)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (vehicle_id, seat_number)
);

-- Verrous temporaires de sièges (10 min pendant le parcours d'achat)
CREATE TABLE IF NOT EXISTS seat_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number INT NOT NULL,
    locked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- NOW() + interval '10 minutes'
    UNIQUE (trip_id, seat_number)
);

-- =====================================================================
-- 4. RÉSERVATIONS, ARTICLES ET PASSAGERS
-- =====================================================================

CREATE TYPE booking_channel_enum AS ENUM ('MOBILE_APP', 'WEB', 'COUNTER_STATION', 'CALL_CENTER');
CREATE TYPE booking_status_enum AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED');

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(30) NOT NULL UNIQUE, -- ex: 'TSR-BK-2026-98432'
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel booking_channel_enum NOT NULL DEFAULT 'MOBILE_APP',
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- Si vente au guichet
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    is_third_party BOOLEAN NOT NULL DEFAULT FALSE,
    purchaser_phone VARCHAR(20) NOT NULL,
    purchaser_name VARCHAR(150) NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
    options_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    insurance_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    insurance_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status booking_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number INT NOT NULL,
    seat_tier seat_tier_enum NOT NULL DEFAULT 'STANDARD',
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    luggage_extra_weight_kg NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (luggage_extra_weight_kg <= 50.00),
    has_bicycle BOOLEAN NOT NULL DEFAULT FALSE,
    has_motorcycle BOOLEAN NOT NULL DEFAULT FALSE,
    item_options_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    UNIQUE (booking_id, seat_number)
);

CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    id_card_number VARCHAR(50), -- CNIB / Passeport
    is_minor BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (booking_id, seat_number)
);

-- =====================================================================
-- 5. PAIEMENTS ET TRANSACTIONS (IDEMPOTENCE ET TRAÇABILITÉ)
-- =====================================================================

CREATE TYPE payment_gateway_enum AS ENUM (
    'ORANGE_MONEY', 
    'MOOV_MONEY', 
    'WAVE', 
    'TELECEL', 
    'LIGDICASH', 
    'PAYDUNYA', 
    'CASH_COUNTER'
);
CREATE TYPE payment_status_enum AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    gateway payment_gateway_enum NOT NULL,
    phone_number VARCHAR(20), -- numéro de débit mobile money
    status payment_status_enum NOT NULL DEFAULT 'INITIATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE, -- garantie contre le double prélèvement
    gateway_reference VARCHAR(150) UNIQUE, -- référence retournée par l'opérateur (Orange/Moov/Wave)
    provider_transaction_id VARCHAR(150),
    request_payload JSONB,
    response_payload JSONB,
    status payment_status_enum NOT NULL DEFAULT 'INITIATED',
    error_message TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 6. BILLETS (TICKETS), QR CODES ET ENREGISTREMENT D'EMBARQUEMENT
-- =====================================================================

CREATE TYPE ticket_status_enum AS ENUM ('VALID', 'BOARDED', 'CANCELLED', 'REFUNDED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(35) NOT NULL UNIQUE, -- Format strict: 'TSR-2026-XXXX'
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE RESTRICT,
    seat_number INT NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status ticket_status_enum NOT NULL DEFAULT 'VALID',
    boarded_at TIMESTAMPTZ,
    boarded_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    boarding_station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Contrainte absolue: un même siège sur un même voyage ne peut avoir qu'un seul billet valide ou embarqué
    CONSTRAINT unq_trip_seat_active UNIQUE (trip_id, seat_number, status)
);

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    token_signature TEXT NOT NULL, -- Signature HMAC SHA-256 avec secret serveur
    nonce VARCHAR(64) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE scan_result_enum AS ENUM (
    'VALID_ACCEPTED', 
    'ALREADY_USED', 
    'WRONG_TRIP', 
    'INVALID_SIGNATURE', 
    'CANCELLED_TICKET', 
    'EXPIRED_TICKET'
);

CREATE TABLE IF NOT EXISTS ticket_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    device_id VARCHAR(100) NOT NULL,
    raw_payload TEXT NOT NULL,
    result scan_result_enum NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_offline_sync BOOLEAN NOT NULL DEFAULT FALSE,
    offline_scanned_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB
);

CREATE TYPE boarding_status_enum AS ENUM ('BOARDED', 'REFUSED', 'NO_SHOW', 'TRANSFERRED');

CREATE TABLE IF NOT EXISTS boarding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE RESTRICT,
    passenger_id UUID NOT NULL REFERENCES passengers(id) ON DELETE RESTRICT,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    seat_number INT NOT NULL,
    boarding_status boarding_status_enum NOT NULL DEFAULT 'BOARDED',
    refusal_reason TEXT,
    boarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(100)
);

-- =====================================================================
-- 7. REMBOURSEMENTS, DÉPENSES ET COMPTABILITÉ
-- =====================================================================

CREATE TYPE refund_status_enum AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    ticket_id UUID REFERENCES tickets(id) ON DELETE RESTRICT,
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    original_amount NUMERIC(10, 2) NOT NULL,
    penalty_rate_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- 10% selon cahier des charges
    penalty_amount NUMERIC(10, 2) NOT NULL,
    refunded_net_amount NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status refund_status_enum NOT NULL DEFAULT 'REQUESTED',
    refund_transaction_reference VARCHAR(100),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE expense_category_enum AS ENUM ('FUEL', 'TOLL_ROAD', 'BUS_MAINTENANCE', 'DRIVER_PERDIEM', 'STATION_SUPPLIES', 'OTHER');

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    entered_by_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    category expense_category_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    receipt_document_url TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 8. GESTION DES COLIS ET LIVRAISONS (FRET INTERURBAIN)
-- =====================================================================

CREATE TYPE package_status_enum AS ENUM (
    'CREATED', 
    'ACCEPTED_AT_STATION', 
    'LOADED_IN_BUS', 
    'IN_TRANSIT', 
    'ARRIVED_AT_DESTINATION', 
    'DELIVERED', 
    'CANCELLED'
);

CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(30) NOT NULL UNIQUE, -- ex: 'TSR-COLIS-2026-10293'
    origin_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    destination_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    assigned_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0 AND weight_kg <= 200.00),
    description TEXT,
    declared_value NUMERIC(10, 2) DEFAULT 0.00,
    shipping_fee NUMERIC(10, 2) NOT NULL CHECK (shipping_fee >= 0),
    pickup_pin_hash VARCHAR(255) NOT NULL, -- Code PIN à 4 chiffres haché pour retrait
    status package_status_enum NOT NULL DEFAULT 'CREATED',
    registered_by_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS package_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
    delivered_by_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    destination_station_id UUID NOT NULL REFERENCES stations(id) ON DELETE RESTRICT,
    recipient_id_card VARCHAR(50) NOT NULL,
    recipient_signature_url TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 9. PROGRAMME DE FIDÉLITÉ (10 VOYAGES = 11E À -50%)
-- =====================================================================

CREATE TABLE IF NOT EXISTS loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    completed_trips_count INT NOT NULL DEFAULT 0 CHECK (completed_trips_count >= 0),
    eligible_for_discount BOOLEAN NOT NULL DEFAULT FALSE,
    discount_rate_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00, -- 50% sur le 11e voyage
    total_lifetime_trips INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE loyalty_action_enum AS ENUM ('TRIP_COMPLETED', 'DISCOUNT_REDEEMED', 'MANUAL_ADJUSTMENT');

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    action loyalty_action_enum NOT NULL,
    trips_delta INT NOT NULL,
    balance_after INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 10. NOTIFICATIONS, PROMOTIONS ET NOTATIONS CLIENTS
-- =====================================================================

CREATE TYPE notification_type_enum AS ENUM (
    'BOOKING_CONFIRMED', 
    'PAYMENT_SUCCESS', 
    'TRIP_REMINDER_H1', 
    'BUS_DELAYED', 
    'BOARDING_OPEN', 
    'TRIP_CANCELLED', 
    'PROMOTION'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    fcm_message_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE, -- ex: 'FESTIVAL-BOBO-2026'
    description TEXT,
    discount_percentage NUMERIC(5, 2) CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    discount_fixed_amount NUMERIC(10, 2),
    applicable_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_uses INT,
    current_uses INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    banner_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    driver_rating INT CHECK (driver_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
    comfort_rating INT CHECK (comfort_rating BETWEEN 1 AND 5),
    service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 11. AUDIT, CYBERSÉCURITÉ ET ALERTES ANTI-FRAUDE
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- ex: 'TICKET_BOARDED', 'PRICE_OVERRIDE', 'AGENT_LOGIN'
    table_name VARCHAR(50),
    record_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE fraud_severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE fraud_status_enum AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL, -- 'DUPLICATE_SCAN_ATTEMPT', 'SIGNATURE_MISMATCH', 'OFFLINE_REPLAY'
    severity fraud_severity_enum NOT NULL DEFAULT 'HIGH',
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    details JSONB NOT NULL,
    status fraud_status_enum NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =====================================================================
-- TSR APP v1.0 — POLITIQUES ROW LEVEL SECURITY (RLS)
-- Sécurité des données multi-rôles pour TSR Transport (Burkina Faso)
-- =====================================================================

-- Activation de RLS sur toutes les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Les tables publiques en lecture (Gares, Trajets, Voyages, Véhicules)
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 1. CONSULTATION PUBLIQUE (Clients & Visiteurs)
-- ---------------------------------------------------------------------

-- Tout le monde peut voir les gares actives et les trajets actifs
CREATE POLICY "Public can view active stations" 
ON stations FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active routes" 
ON routes FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view scheduled trips" 
ON trips FOR SELECT USING (status IN ('SCHEDULED', 'BOARDING', 'DELAYED'));

CREATE POLICY "Public can view seats configuration" 
ON seats FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view active promotions" 
ON promotions FOR SELECT USING (is_active = TRUE AND end_date >= CURRENT_DATE);

-- ---------------------------------------------------------------------
-- 2. POLITIQUES POUR LES CLIENTS (Passagers)
-- ---------------------------------------------------------------------

-- L'utilisateur ne voit que son propre profil
CREATE POLICY "Users can view and edit their own profile" 
ON users FOR ALL USING (auth.uid() = id);

-- Le client ne voit que ses réservations
CREATE POLICY "Clients can view their own bookings" 
ON bookings FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Clients can create bookings" 
ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Le client ne voit que ses passagers associés à ses réservations
CREATE POLICY "Clients can view their own passengers" 
ON passengers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = passengers.booking_id AND bookings.customer_id = auth.uid()
    )
);

-- Le client ne voit que ses propres billets émis
CREATE POLICY "Clients can view their own tickets" 
ON tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = tickets.booking_id AND bookings.customer_id = auth.uid()
    )
);

-- Le client voit ses paiements
CREATE POLICY "Clients can view their payments" 
ON payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = payments.booking_id AND bookings.customer_id = auth.uid()
    )
);

-- Le client voit son compte fidélité
CREATE POLICY "Clients can view their own loyalty account" 
ON loyalty_accounts FOR SELECT USING (auth.uid() = user_id);

-- Le client voit ses colis envoyés ou reçus
CREATE POLICY "Clients can view their packages" 
ON packages FOR SELECT USING (
    sender_phone = (SELECT phone_number FROM users WHERE id = auth.uid()) OR
    recipient_phone = (SELECT phone_number FROM users WHERE id = auth.uid())
);

-- ---------------------------------------------------------------------
-- 3. POLITIQUES POUR LES AGENTS DE CONTRÔLE ET GUICHETIERS
-- ---------------------------------------------------------------------

-- Les guichetiers peuvent créer des réservations et des passagers en gare
CREATE POLICY "Agents can create bookings at counter" 
ON bookings FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.user_id = auth.uid() AND agents.role IN ('GUICHETIER', 'RESPONSABLE_GARE', 'SUPERVISEUR')
    )
);

-- Les contrôleurs et guichetiers peuvent consulter les billets pour le contrôle
CREATE POLICY "Agents can view tickets for trip verification" 
ON tickets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.user_id = auth.uid() AND agents.is_active = TRUE
    )
);

-- Les contrôleurs peuvent insérer des scans de billets
CREATE POLICY "Agents can record ticket scans" 
ON ticket_scans FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.user_id = auth.uid() AND agents.id = agent_id
    )
);

-- Les contrôleurs peuvent créer des enregistrements d'embarquement
CREATE POLICY "Agents can record passenger boarding" 
ON boarding_records FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM agents 
        WHERE agents.user_id = auth.uid() AND agents.id = agent_id
    )
);

-- ---------------------------------------------------------------------
-- 4. POLITIQUES POUR LES ADMINISTRATEURS ET COMPTABLES
-- ---------------------------------------------------------------------

-- Les administrateurs et la direction TSR ont un accès complet
CREATE POLICY "Admins have full access on bookings" 
ON bookings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'GERANT', 'COMPTABLE')
    )
);

CREATE POLICY "Admins have full access on tickets" 
ON tickets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'GERANT')
    )
);

CREATE POLICY "Admins and Accountants can view payments" 
ON payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'GERANT', 'COMPTABLE')
    )
);

CREATE POLICY "Admins can view and manage fraud alerts" 
ON fraud_alerts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISEUR')
    )
);

CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN')
    )
);

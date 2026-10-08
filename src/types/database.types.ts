/**
 * TSR APP v1.0 — Définitions TypeScript du Modèle de Données PostgreSQL
 * Société de Transport TSR Transport (Burkina Faso)
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'GERANT' 
  | 'RESPONSABLE_GARE' 
  | 'COMPTABLE' 
  | 'SUPERVISEUR' 
  | 'GUICHETIER' 
  | 'AGENT_CONTROLE' 
  | 'CHAUFFEUR' 
  | 'CLIENT';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
export type VehicleCategory = 'STANDARD' | 'VIP' | 'CLIMATISE';
export type VehicleStatus = 'IN_SERVICE' | 'MAINTENANCE' | 'RESERVE' | 'RETIRED';
export type TripStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED';
export type SeatTier = 'STANDARD' | 'VIP' | 'CREW_RESERVED';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';
export type BookingChannel = 'MOBILE_APP' | 'WEB' | 'COUNTER_STATION' | 'CALL_CENTER';
export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'PARTIALLY_REFUNDED' | 'FULLY_REFUNDED';
export type PaymentGateway = 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE' | 'TELECEL' | 'LIGDICASH' | 'PAYDUNYA' | 'CASH_COUNTER';
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type TicketStatus = 'VALID' | 'BOARDED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
export type ScanResult = 'VALID_ACCEPTED' | 'ALREADY_USED' | 'WRONG_TRIP' | 'INVALID_SIGNATURE' | 'CANCELLED_TICKET' | 'EXPIRED_TICKET';
export type BoardingStatus = 'BOARDED' | 'REFUSED' | 'NO_SHOW' | 'TRANSFERRED';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
export type PackageStatus = 'CREATED' | 'ACCEPTED_AT_STATION' | 'LOADED_IN_BUS' | 'IN_TRANSIT' | 'ARRIVED_AT_DESTINATION' | 'DELIVERED' | 'CANCELLED';
export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  region: string;
  country: string;
}

export interface Station {
  id: string;
  city_id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  category: VehicleCategory;
  total_seats: number;
  current_station_id?: string;
  status: VehicleStatus;
  has_wifi: boolean;
  has_ac: boolean;
  has_usb_ports: boolean;
}

export interface Seat {
  id: string;
  vehicle_id: string;
  seat_number: number;
  seat_label: string;
  tier: SeatTier;
  row_index: number;
  col_index: number;
  is_active: boolean;
}

export interface SeatLock {
  id: string;
  trip_id: string;
  seat_number: number;
  locked_by_user_id?: string;
  session_token: string;
  locked_at: string;
  expires_at: string;
}

export interface Route {
  id: string;
  origin_station_id: string;
  destination_station_id: string;
  distance_km: number;
  estimated_duration_minutes: number;
  base_price_standard: number;
  base_price_vip: number;
  is_active: boolean;
}

export interface Trip {
  id: string;
  trip_code: string;
  route_id: string;
  vehicle_id: string;
  driver_id?: string;
  departure_time: string;
  estimated_arrival_time: string;
  price_standard: number;
  price_vip: number;
  status: TripStatus;
  boarding_gate: string;
  delay_minutes: number;
}

export interface Booking {
  id: string;
  booking_reference: string;
  customer_id?: string;
  channel: BookingChannel;
  agent_id?: string;
  trip_id: string;
  is_third_party: boolean;
  purchaser_phone: string;
  purchaser_name: string;
  subtotal_amount: number;
  options_amount: number;
  discount_amount: number;
  total_amount: number;
  insurance_opt_in: boolean;
  insurance_fee: number;
  status: BookingStatus;
  payment_expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  seat_number: number;
  seat_tier: SeatTier;
  unit_price: number;
  luggage_extra_weight_kg: number;
  has_bicycle: boolean;
  has_motorcycle: boolean;
  item_options_fee: number;
}

export interface Passenger {
  id: string;
  booking_id: string;
  seat_number: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  id_card_number?: string;
  is_minor: boolean;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  phone_number?: string;
  status: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  idempotency_key: string;
  gateway_reference?: string;
  provider_transaction_id?: string;
  status: PaymentStatus;
  verified_at?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ticket {
  id: string;
  ticket_number: string; // ex: 'TSR-2026-4587'
  booking_id: string;
  trip_id: string;
  passenger_id: string;
  seat_number: number;
  amount_paid: number;
  status: TicketStatus;
  boarded_at?: string;
  boarded_by_agent_id?: string;
  boarding_station_id?: string;
  issued_at: string;
}

export interface QRCodeData {
  id: string;
  ticket_id: string;
  token_signature: string;
  nonce: string;
  payload: {
    ticketNumber: string;
    passenger: string;
    trip: string;
    seat: number;
    origin: string;
    destination: string;
    date: string;
    time: string;
    category: VehicleCategory;
    amount: number;
  };
  expires_at: string;
  is_revoked: boolean;
}

export interface TicketScan {
  id: string;
  ticket_id?: string;
  agent_id: string;
  station_id: string;
  device_id: string;
  raw_payload: string;
  result: ScanResult;
  is_offline_sync: boolean;
  synced_at: string;
}

export interface Package {
  id: string;
  tracking_code: string;
  origin_station_id: string;
  destination_station_id: string;
  assigned_trip_id?: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  weight_kg: number;
  description?: string;
  shipping_fee: number;
  status: PackageStatus;
  registered_by_agent_id: string;
  created_at: string;
}

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  phone_number: string;
  completed_trips_count: number;
  eligible_for_discount: boolean;
  discount_rate_percentage: number;
  total_lifetime_trips: number;
}

export interface FraudAlert {
  id: string;
  alert_type: string;
  severity: FraudSeverity;
  ticket_id?: string;
  agent_id?: string;
  station_id?: string;
  details: Record<string, unknown>;
  status: FraudStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

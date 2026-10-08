/**
 * TSR APP v1.0 — Backend Models
 */
export * from '../../types/database.types';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  expiresAt: string;
}

export interface SeatWithStatus {
  seatNumber: number;
  label: string;
  tier: 'STANDARD' | 'VIP' | 'CREW_RESERVED';
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'SELECTED';
  price: number;
  rowIndex: number;
  colIndex: number;
  lockedBySession?: string;
  expiresAt?: string;
}

export interface BookingCreationRequest {
  tripId: string;
  purchaserName: string;
  purchaserPhone: string;
  isThirdParty: boolean;
  insuranceOptIn: boolean;
  passengers: Array<{
    seatNumber: number;
    firstName: string;
    lastName: string;
    phone: string;
    idCardNumber?: string;
    luggageExtraWeightKg: number;
    hasBicycle: boolean;
    hasMotorcycle: boolean;
  }>;
  packageOption?: {
    description: string;
    weightKg: number;
    recipientName: string;
    recipientPhone: string;
  };
}

export interface SearchTripsQuery {
  originStationId?: string;
  destinationStationId?: string;
  date?: string;
  category?: 'STANDARD' | 'VIP' | 'CLIMATISE';
}

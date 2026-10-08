/**
 * TSR APP v1.0 — API Controllers
 * Couche de médiation requête / service avec validation centralisée
 */
import {
  AuthService,
  StationService,
  TripService,
  SeatLockService,
  BookingService,
  TicketService,
} from '../services';
import { BookingCreationRequest, SearchTripsQuery } from '../models';

export const ApiController = {
  // Gares
  getStations(lat?: number, lng?: number) {
    return StationService.getStationsWithDistance(lat, lng);
  },

  // Trajets
  searchTrips(query: SearchTripsQuery) {
    return TripService.searchTrips(query);
  },

  getTripDetails(tripId: string) {
    return TripService.getTripDetails(tripId);
  },

  // Sièges & Verrous
  getSeats(tripId: string, sessionToken: string) {
    return SeatLockService.getSeatsForTrip(tripId, sessionToken);
  },

  lockSeat(tripId: string, seatNumber: number, sessionToken: string, userId?: string) {
    return SeatLockService.lockSeat(tripId, seatNumber, sessionToken, userId);
  },

  unlockSeat(tripId: string, seatNumber: number, sessionToken: string) {
    return SeatLockService.unlockSeat(tripId, seatNumber, sessionToken);
  },

  // Réservations
  createBooking(request: BookingCreationRequest, sessionToken: string, customerId?: string) {
    return BookingService.createBooking(request, sessionToken, customerId);
  },

  getBooking(reference: string) {
    return BookingService.getBookingByReference(reference);
  },

  // Billets
  getUserTickets(phone?: string) {
    return TicketService.getUserTickets(phone);
  },

  // Auth
  sendOtp(phone: string) {
    return AuthService.sendOtp(phone);
  },

  loginWithOtp(phone: string, otp: string) {
    return AuthService.verifyOtpAndLogin(phone, otp);
  },

  register(data: { phone: string; firstName: string; lastName: string }) {
    return AuthService.register(data);
  },
};

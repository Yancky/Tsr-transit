/**
 * TSR APP v1.0 — Server-side Validators
 */

export class ValidationError extends Error {
  public field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const Validators = {
  isValidBurkinaPhone(phone: string): boolean {
    if (!phone) return false;
    // Accepte format +226XXXXXXXX ou 00226XXXXXXXX ou 8 chiffres locaux 70XXXXXX / 76XXXXXX etc.
    const clean = phone.replace(/[\s-]/g, '');
    const regex = /^(\+226|00226)?[567][0-9]{7}$/;
    return regex.test(clean);
  },

  formatBurkinaPhone(phone: string): string {
    const clean = phone.replace(/[\s-]/g, '');
    if (clean.startsWith('+226')) return clean;
    if (clean.startsWith('00226')) return '+' + clean.slice(2);
    if (clean.length === 8) return '+226' + clean;
    return clean;
  },

  validateRegistration(data: { phone: string; firstName: string; lastName: string; password?: string }) {
    if (!data.firstName || data.firstName.trim().length < 2) {
      throw new ValidationError('Le prénom doit comporter au moins 2 caractères.', 'firstName');
    }
    if (!data.lastName || data.lastName.trim().length < 2) {
      throw new ValidationError('Le nom de famille est obligatoire.', 'lastName');
    }
    if (!this.isValidBurkinaPhone(data.phone)) {
      throw new ValidationError('Numéro de téléphone burkinabè invalide (ex: +226 70 12 34 56).', 'phone');
    }
  },

  validateBooking(data: {
    tripId: string;
    purchaserName: string;
    purchaserPhone: string;
    passengers: Array<{ seatNumber: number; firstName: string; lastName: string; luggageExtraWeightKg: number }>;
  }) {
    if (!data.tripId) {
      throw new ValidationError('Le voyage sélectionné est requis.', 'tripId');
    }
    if (!data.purchaserName || data.purchaserName.trim().length < 2) {
      throw new ValidationError('Le nom du contact de réservation est obligatoire.', 'purchaserName');
    }
    if (!this.isValidBurkinaPhone(data.purchaserPhone)) {
      throw new ValidationError('Le numéro de téléphone du contact est invalide.', 'purchaserPhone');
    }
    if (!data.passengers || data.passengers.length === 0) {
      throw new ValidationError('Veuillez sélectionner au moins un passager et un siège.', 'passengers');
    }
    for (const p of data.passengers) {
      if (!p.seatNumber || p.seatNumber < 1 || p.seatNumber > 70) {
        throw new ValidationError(`Numéro de siège invalide : ${p.seatNumber}`, 'seatNumber');
      }
      if (!p.firstName || !p.lastName) {
        throw new ValidationError(`Nom et prénom requis pour le siège n°${p.seatNumber}`, 'passengers');
      }
      if (p.luggageExtraWeightKg > 50) {
        throw new ValidationError(`Le poids de bagage supplémentaire ne peut pas dépasser 50 kg pour le siège n°${p.seatNumber}`, 'luggage');
      }
    }
  }
};

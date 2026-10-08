/**
 * TSR APP v1.0 — Design Tokens
 * Couleurs identitaires TSR : Vert, Jaune, Blanc
 */

export const colors = {
  primary: {
    DEFAULT: '#008751', // Vert TSR
    dark: '#00683e',
    light: '#e8f5e9',
    surface: '#f0fdf4',
  },
  accent: {
    DEFAULT: '#fcd116', // Jaune TSR
    dark: '#d4af00',
    light: '#fef9c3',
  },
  neutral: {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  seats: {
    available: '#10b981', // Vert = Libre
    booked: '#ef4444',    // Rouge = Occupé
    vip: '#f59e0b',       // Jaune = VIP
    crew: '#334155',      // Noir/Gris foncé = Réservé équipage
    selected: '#2563eb',  // Bleu = Sélectionné
    locked: '#f97316',    // Orange = Verrouillé en cours par tiers
  },
};

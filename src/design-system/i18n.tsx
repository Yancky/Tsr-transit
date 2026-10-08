/**
 * TSR APP v1.0 — Architecture Multilingue (Français & Mooré)
 */
import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'fr' | 'moo';

export const translations = {
  fr: {
    // Slogan & Entête
    app_title: 'TSR Transport',
    slogan: 'Votre voyage, notre priorité.',
    welcome_greeting: 'Bonjour',
    guest: 'Voyageur',
    
    // Actions principales
    btn_search: 'RECHERCHER',
    btn_login: 'Se connecter',
    btn_register: "S'inscrire",
    btn_continue_guest: 'Continuer en tant que visiteur',
    btn_choose: 'CHOISIR',
    btn_validate: 'VALIDER LA VENTE',
    btn_confirm: 'CONFIRMER LA RÉSERVATION',
    btn_itinerary: 'Itinéraire',
    btn_cancel: 'Annuler',
    btn_back: 'Retour',
    btn_select_seats: 'Choisir mes sièges',
    
    // Champs de recherche
    label_departure: 'Ville de départ',
    label_destination: 'Ville d’arrivée',
    label_date: 'Date de départ',
    label_time: 'Heure',
    label_passengers: 'Passagers',
    label_car_type: 'Type de car',
    
    // Types de car
    type_standard: 'Standard',
    type_vip: 'VIP',
    type_ac: 'Climatisé',
    
    // Sièges
    seat_free: 'Libre',
    seat_occupied: 'Occupé',
    seat_vip: 'VIP',
    seat_crew: 'Réservé chauffeur/équipage',
    seat_selected: 'Sélectionné',
    seat_locked_third_party: 'En cours de sélection par un autre voyageur',
    selected_seats: 'Sièges sélectionnés',
    total_price: 'Prix total',
    
    // Options
    options_title: 'Options supplémentaires',
    opt_luggage: 'Bagage supplémentaire (>20 kg)',
    opt_moto: 'Transport de moto',
    opt_bike: 'Transport de vélo',
    opt_package: 'Envoi de colis associé',
    opt_insurance: 'Assurance voyage (100 FCFA)',
    buy_for_third_party: 'Acheter pour un proche',
    
    // Navigation
    nav_home: 'Accueil',
    nav_tickets: 'Mes Billets',
    nav_profile: 'Mon Profil',
    
    // Fidélité
    loyalty_title: 'Programme Fidélité TSR',
    loyalty_status: '10 voyages effectués = 11ᵉ à -50%',
    
    // Statuts
    status_valid: 'BILLET VALIDE',
    status_boarded: 'EMBARQUÉ',
  },
  moo: {
    // Mooré translations (Burkina Faso)
    app_title: 'TSR Soore',
    slogan: 'Yãmb sore la d tʋʋmda.',
    welcome_greeting: 'Ne y beogo',
    guest: 'Soore-dãmb',
    
    btn_search: 'BAOG SOORE',
    btn_login: 'Kẽe pʋga',
    btn_register: 'Gʋls f yʋʋre',
    btn_continue_guest: 'Kẽ wa saam-biiga',
    btn_choose: 'YÃK A WÃNA',
    btn_validate: 'SAK TƖ BOOLA',
    btn_confirm: 'SAK BILIYE TƲƲMDA',
    btn_itinerary: 'Sore kẽndre',
    btn_cancel: 'Basi',
    btn_back: 'Leb biiga',
    btn_select_seats: 'Yãk f zĩisi',
    
    label_departure: 'Yikre tẽnga',
    label_destination: 'Kẽndre tẽnga',
    label_date: 'Kẽnd daar',
    label_time: 'Wakat',
    label_passengers: 'Ninsaalba',
    label_car_type: 'Mobil buudu',
    
    type_standard: 'Zaalem',
    type_vip: 'VIP kãsenga',
    type_ac: 'Mobil sẽn yaa pemsem',
    
    seat_free: 'Zaalem',
    seat_occupied: 'Zĩndame',
    seat_vip: 'VIP zĩiga',
    seat_crew: 'Mobil gilli-dãmba',
    seat_selected: 'Yãkame',
    seat_locked_third_party: 'Ned a to n zãad zĩiga',
    selected_seats: 'Zĩisi n yãka',
    total_price: 'Ligdi fãa',
    
    options_title: 'Teed paasgo',
    opt_luggage: 'Tibaog paasgo',
    opt_moto: 'Kutu-wẽnde (moto) tʋlsem',
    opt_bike: 'Kutu-wẽnde (kẽkẽ)',
    opt_package: 'Koli tʋlsem',
    opt_insurance: 'Laoore tẽegre (100 FCFA)',
    buy_for_third_party: 'Da n kõ ned a to',
    
    nav_home: 'Yiri',
    nav_tickets: 'M Biliye-dãmba',
    nav_profile: 'M Menga',
    
    loyalty_title: 'TSR Soore Nõor Maana',
    loyalty_status: 'Sore piig (10) poore = 11e yaa -50%',
    status_valid: 'BILIYE SEEDA',
    status_boarded: 'KẼE MOBIL PƲGA',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['fr']) => string;
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => translations.fr[key] || key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('fr');

  const t = (key: keyof typeof translations['fr']): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] || translations.fr[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

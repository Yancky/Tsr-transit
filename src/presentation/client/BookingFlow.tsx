/**
 * TSR APP v1.0 — Parcours Complet de Recherche & Réservation Client
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Bus,
  Calendar,
  Clock,
  Luggage,
  Shield,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Bike,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { Alert } from '../../design-system/components/Alert';
import { BusSeatMap } from '../../design-system/components/BusSeatMap';
import { ApiController } from '../../backend/controllers';
import { SeatWithStatus } from '../../backend/models';
import { useI18n } from '../../design-system/i18n';
import { PaymentModal } from './PaymentModal';

interface BookingFlowProps {
  sessionToken: string;
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  onBookingSuccess: (bookingRef: string) => void;
  onOpenStationMap: () => void;
}

export function BookingFlow({
  sessionToken,
  currentUser,
  onBookingSuccess,
  onOpenStationMap,
}: BookingFlowProps) {
  const { t } = useI18n();

  // Étape du parcours : 'SEARCH' | 'RESULTS' | 'SEATS' | 'OPTIONS' | 'SUMMARY'
  const [step, setStep] = useState<'SEARCH' | 'RESULTS' | 'SEATS' | 'OPTIONS' | 'SUMMARY'>('SEARCH');

  // Critères de recherche
  const stations = ApiController.getStations();
  const [originId, setOriginId] = useState<string>('st-ouaga-01');
  const [destId, setDestId] = useState<string>('st-bobo-01');
  const [departureDate, setDepartureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [carType, setCarType] = useState<'ALL' | 'VIP' | 'STANDARD'>('ALL');

  // Résultats de recherche
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  // Sièges
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<number[]>([]);
  const [concurrencyError, setConcurrencyError] = useState<string | null>(null);
  const [seatLockTimer, setSeatLockTimer] = useState<number>(600); // 10 minutes en secondes

  // Options
  const [isThirdParty, setIsThirdParty] = useState<boolean>(false);
  const [thirdPartyName, setThirdPartyName] = useState<string>('');
  const [thirdPartyPhone, setThirdPartyPhone] = useState<string>('');
  const [insuranceOptIn, setInsuranceOptIn] = useState<boolean>(true);
  const [luggageKg, setLuggageKg] = useState<number>(0);
  const [hasMotorcycle, setHasMotorcycle] = useState<boolean>(false);
  const [hasBicycle, setHasBicycle] = useState<boolean>(false);
  const [colisOption, setColisOption] = useState<boolean>(false);
  const [colisDesc, setColisDesc] = useState<string>('');
  const [colisRecipientPhone, setColisRecipientPhone] = useState<string>('');

  // Passagers par siège
  const [passengersData, setPassengersData] = useState<
    Array<{ seatNumber: number; firstName: string; lastName: string; phone: string; idCard: string }>
  >([]);

  // Confirmation finale
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Exécution de la recherche de trajets
  const handleSearch = () => {
    const results = ApiController.searchTrips({
      originStationId: originId,
      destinationStationId: destId,
      category: carType === 'ALL' ? undefined : carType,
    });
    setTrips(results);
    setStep('RESULTS');
  };

  // Sélection d'un car -> Chargement des 70 sièges
  const handleSelectTrip = (trip: any) => {
    setSelectedTrip(trip);
    setConcurrencyError(null);
    setSelectedSeatNumbers([]);
    const seatList = ApiController.getSeats(trip.id, sessionToken);
    setSeats(seatList);
    setStep('SEATS');
    setSeatLockTimer(600);
  };

  // Compte à rebours du verrou de 10 minutes
  useEffect(() => {
    if (step === 'SEATS' && selectedSeatNumbers.length > 0) {
      const interval = setInterval(() => {
        setSeatLockTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, selectedSeatNumbers]);

  // Clic sur un siège du plan 70 places
  const handleToggleSeat = (seatNumber: number) => {
    setConcurrencyError(null);

    // Déjà sélectionné -> Libération
    if (selectedSeatNumbers.includes(seatNumber)) {
      ApiController.unlockSeat(selectedTrip.id, seatNumber, sessionToken);
      setSelectedSeatNumbers((prev) => prev.filter((n) => n !== seatNumber));
      const updated = ApiController.getSeats(selectedTrip.id, sessionToken);
      setSeats(updated);
      return;
    }

    // Nouvelle sélection -> Appel atomique au SeatLockService backend
    try {
      ApiController.lockSeat(selectedTrip.id, seatNumber, sessionToken, currentUser?.id);
      setSelectedSeatNumbers((prev) => [...prev, seatNumber].sort((a, b) => a - b));
      const updated = ApiController.getSeats(selectedTrip.id, sessionToken);
      setSeats(updated);
    } catch (err: any) {
      // Détection de concurrence : ex siège 15 déjà verrouillé
      setConcurrencyError(err.message || 'Ce siège est en cours de sélection par un autre voyageur.');
      const updated = ApiController.getSeats(selectedTrip.id, sessionToken);
      setSeats(updated);
    }
  };

  // Préparation des passagers
  const handleProceedToOptions = () => {
    if (selectedSeatNumbers.length === 0) return;

    // Initialiser la liste des passagers
    const initialPassengers = selectedSeatNumbers.map((seatNum, idx) => ({
      seatNumber: seatNum,
      firstName: idx === 0 && currentUser ? currentUser.firstName : '',
      lastName: idx === 0 && currentUser ? currentUser.lastName : '',
      phone: idx === 0 && currentUser ? currentUser.phoneNumber : '',
      idCard: '',
    }));
    setPassengersData(initialPassengers);
    setStep('OPTIONS');
  };

  // Calcul dynamique des montants
  const calculateTotals = () => {
    if (!selectedTrip) return { subtotal: 0, optionsFee: 0, insuranceFee: 0, total: 0 };

    let subtotal = 0;
    selectedSeatNumbers.forEach((seatNum) => {
      const seat = seats.find((s) => s.seatNumber === seatNum);
      subtotal += seat?.tier === 'VIP' ? selectedTrip.price_vip : selectedTrip.price_standard;
    });

    let optionsFee = 0;
    if (luggageKg > 0) optionsFee += Math.ceil(luggageKg / 10) * 1000;
    if (hasMotorcycle) optionsFee += 15000;
    if (hasBicycle) optionsFee += 3000;
    if (colisOption) optionsFee += 3500;

    const insuranceFee = insuranceOptIn ? selectedSeatNumbers.length * 100 : 0;
    const total = subtotal + optionsFee + insuranceFee;

    return { subtotal, optionsFee, insuranceFee, total };
  };

  const totals = calculateTotals();

  // Soumission définitive de la réservation vers le Backend
  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    try {
      const purchaserName = isThirdParty
        ? thirdPartyName
        : currentUser
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : passengersData[0]?.firstName + ' ' + passengersData[0]?.lastName;

      const purchaserPhone = isThirdParty
        ? thirdPartyPhone
        : currentUser
        ? currentUser.phoneNumber
        : passengersData[0]?.phone;

      const response = ApiController.createBooking(
        {
          tripId: selectedTrip.id,
          purchaserName: purchaserName || 'Voyageur TSR',
          purchaserPhone: purchaserPhone || '+22670000000',
          isThirdParty,
          insuranceOptIn,
          passengers: passengersData.map((p) => ({
            seatNumber: p.seatNumber,
            firstName: p.firstName || 'Passager',
            lastName: p.lastName || `Siège ${p.seatNumber}`,
            phone: p.phone || purchaserPhone || '+22670000000',
            idCardNumber: p.idCard,
            luggageExtraWeightKg: luggageKg,
            hasBicycle,
            hasMotorcycle,
          })),
          packageOption: colisOption
            ? {
                description: colisDesc || 'Colis divers',
                weightKg: 10,
                recipientName: 'Destinataire',
                recipientPhone: colisRecipientPhone || '+22670000000',
              }
            : undefined,
        },
        sessionToken,
        currentUser?.id
      );

      setCreatedBooking(response.booking);
      setStep('SUMMARY');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la réservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* ========================================================
          ÉTAPE 1 : FORMULAIRE DE RECHERCHE DE TRAJET
         ======================================================== */}
      {step === 'SEARCH' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-[#008751] to-[#005e38] text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                TSR Transport Burkina
              </span>
              <h2 className="text-xl font-black tracking-tight">Rechercher un trajet</h2>
              <p className="text-xs text-emerald-100 mt-1">
                Lignes directes sécurisées entre Ouagadougou, Bobo, Koudougou et Ouahigouya.
              </p>
            </div>
            <Bus className="w-24 h-24 text-emerald-400/20 absolute -right-3 -bottom-4 pointer-events-none" />
          </div>

          <Card variant="elevated" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('label_departure')}
                </label>
                <select
                  value={originId}
                  onChange={(e) => setOriginId(e.target.value)}
                  className="w-full h-12 bg-white text-slate-900 text-sm font-semibold rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-[#008751]/20 focus:border-[#008751]"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('label_destination')}
                </label>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className="w-full h-12 bg-white text-slate-900 text-sm font-semibold rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-[#008751]/20 focus:border-[#008751]"
                >
                  {stations
                    .filter((st) => st.id !== originId)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('label_date')}
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t('label_car_type')}
                  </label>
                  <select
                    value={carType}
                    onChange={(e) => setCarType(e.target.value as any)}
                    className="w-full h-12 bg-white text-slate-900 text-sm font-semibold rounded-xl border border-slate-200 px-3 focus:ring-2 focus:ring-[#008751]/20 focus:border-[#008751]"
                  >
                    <option value="ALL">Tous les cars</option>
                    <option value="VIP">⭐ VIP Climatisé</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              variant="accent"
              fullWidth
              size="lg"
              onClick={handleSearch}
              className="text-slate-900 font-black shadow-md mt-2"
            >
              {t('btn_search')}
            </Button>

            <button
              type="button"
              onClick={onOpenStationMap}
              className="w-full text-center text-xs font-bold text-[#008751] hover:underline flex items-center justify-center gap-1.5 pt-1"
            >
              <span>🗺 Voir la carte des gares et calculer les distances</span>
            </button>
          </Card>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 2 : RÉSULTATS DE RECHERCHE DE DÉPARTS
         ======================================================== */}
      {step === 'RESULTS' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('SEARCH')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              ← Modifier la recherche
            </button>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {trips.length} départs trouvés
            </span>
          </div>

          <div className="space-y-3">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                variant="elevated"
                className="hover:border-[#008751] transition-all cursor-pointer border-slate-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#008751] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      TSR Transport
                    </span>
                    <Badge variant={trip.vehicle.category === 'VIP' ? 'vip' : 'standard'}>
                      {trip.vehicle.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">
                      {trip.price_vip.toLocaleString()} FCFA
                    </span>
                    {trip.price_standard < trip.price_vip && (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Standard dès {trip.price_standard.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between my-3 text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-left">
                    <span className="text-sm font-black text-slate-900 block">
                      {trip.departure_time.slice(11, 16)}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[120px] block">
                      {trip.originStation.name}
                    </span>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {Math.floor(trip.route.estimated_duration_minutes / 60)}h
                      {trip.route.estimated_duration_minutes % 60}m
                    </span>
                    <div className="w-16 h-0.5 bg-emerald-300 relative my-1">
                      <div className="w-2 h-2 rounded-full bg-[#008751] absolute -top-[3px] right-0" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {trip.route.distance_km} km
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {trip.estimated_arrival_time.slice(11, 16)}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[120px] block">
                      {trip.destinationStation.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      {trip.availableSeats} / {trip.totalSeats} places disponibles
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSelectTrip(trip)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {t('btn_choose')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 3 : PLAN DES SIÈGES DU CAR (70 PLACES)
         ======================================================== */}
      {step === 'SEATS' && selectedTrip && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('RESULTS')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Changer de car
            </button>

            {/* Minuteur du verrou serveur de 10 minutes */}
            <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Timer className="w-3.5 h-3.5" />
              <span>
                Verrouillé : {Math.floor(seatLockTimer / 60)}:
                {(seatLockTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900">
                {selectedTrip.originStation.name} → {selectedTrip.destinationStation.name}
              </h3>
              <p className="text-[11px] text-slate-500">
                Départ {selectedTrip.departure_time.slice(11, 16)} • {selectedTrip.vehicle.brand}{' '}
                {selectedTrip.vehicle.category} (70 places)
              </p>
            </div>
            <Badge variant="vip">{selectedTrip.vehicle.category}</Badge>
          </div>

          {/* Plan interactif des 70 sièges */}
          <BusSeatMap
            seats={seats}
            selectedSeatNumbers={selectedSeatNumbers}
            onToggleSeat={handleToggleSeat}
            concurrencyError={concurrencyError}
          />

          {/* Bandeau de validation des sièges */}
          <div className="sticky bottom-20 bg-white p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between z-20">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                {selectedSeatNumbers.length === 0
                  ? 'Aucun siège choisi'
                  : `Sièges sélectionnés : ${selectedSeatNumbers.join(', ')}`}
              </span>
              <span className="text-base font-black text-slate-900">
                {totals.subtotal.toLocaleString()} FCFA
              </span>
            </div>

            <Button
              variant="accent"
              size="md"
              disabled={selectedSeatNumbers.length === 0}
              onClick={handleProceedToOptions}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Suivant ({selectedSeatNumbers.length})
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 4 : OPTIONS SUPPLÉMENTAIRES & PASSAGERS
         ======================================================== */}
      {step === 'OPTIONS' && (
        <div className="space-y-4 animate-fadeIn">
          <button
            onClick={() => setStep('SEATS')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            ← Modifier les sièges ({selectedSeatNumbers.join(', ')})
          </button>

          <Card variant="elevated" className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#008751]" />
              Identité des Passagers
            </h3>

            {passengersData.map((p, idx) => (
              <div key={p.seatNumber} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#008751]">
                    Passager {idx + 1} — Siège n°{p.seatNumber}
                  </span>
                  <Badge variant="neutral">Siège {p.seatNumber}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Prénom"
                    value={p.firstName}
                    onChange={(e) => {
                      const updated = [...passengersData];
                      updated[idx].firstName = e.target.value;
                      setPassengersData(updated);
                    }}
                  />
                  <Input
                    placeholder="Nom de famille"
                    value={p.lastName}
                    onChange={(e) => {
                      const updated = [...passengersData];
                      updated[idx].lastName = e.target.value;
                      setPassengersData(updated);
                    }}
                  />
                </div>
                <Input
                  isPhoneBurkina
                  placeholder="70123456"
                  value={p.phone}
                  onChange={(e) => {
                    const updated = [...passengersData];
                    updated[idx].phone = e.target.value;
                    setPassengersData(updated);
                  }}
                />
              </div>
            ))}

            {/* Option Achat pour un tiers */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={(e) => setIsThirdParty(e.target.checked)}
                  className="w-4 h-4 accent-[#008751] rounded"
                />
                <span>Acheter pour un proche (bénéficiaire différent)</span>
              </label>

              {isThirdParty && (
                <div className="grid grid-cols-2 gap-2 mt-2 pl-6 animate-fadeIn">
                  <Input
                    placeholder="Nom du proche"
                    value={thirdPartyName}
                    onChange={(e) => setThirdPartyName(e.target.value)}
                  />
                  <Input
                    isPhoneBurkina
                    placeholder="Téléphone"
                    value={thirdPartyPhone}
                    onChange={(e) => setThirdPartyPhone(e.target.value)}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Options de bagages & fret */}
          <Card variant="elevated" className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Luggage className="w-4 h-4 text-[#008751]" />
              Options Supplémentaires
            </h3>

            {/* Bagage supplémentaire */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Bagage supplémentaire (jusqu'à 50 kg max)</span>
                <span className="text-[#008751]">
                  {luggageKg > 0 ? `+${(Math.ceil(luggageKg / 10) * 1000).toLocaleString()} FCFA` : 'Franchise 20kg incluse'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={luggageKg}
                  onChange={(e) => setLuggageKg(Number(e.target.value))}
                  className="flex-1 accent-[#008751]"
                />
                <span className="text-xs font-black text-slate-900 w-12 text-right">
                  {luggageKg} kg
                </span>
              </div>
            </div>

            {/* Transport Moto & Vélo */}
            <div className="grid grid-cols-2 gap-2">
              <label className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasMotorcycle}
                    onChange={(e) => setHasMotorcycle(e.target.checked)}
                    className="w-4 h-4 accent-[#008751]"
                  />
                  <span>Moto</span>
                </div>
                <span className="text-[11px] font-black text-[#008751] mt-1">+15 000 FCFA</span>
              </label>

              <label className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasBicycle}
                    onChange={(e) => setHasBicycle(e.target.checked)}
                    className="w-4 h-4 accent-[#008751]"
                  />
                  <span>Vélo</span>
                </div>
                <span className="text-[11px] font-black text-[#008751] mt-1">+3 000 FCFA</span>
              </label>
            </div>

            {/* Assurance Voyage (100 FCFA) */}
            <label className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                <Shield className="w-4 h-4 text-[#008751]" />
                <div>
                  <span>Assurance voyage TSR</span>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Couverture bagages et assistance médicale
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#008751]">
                  +{(selectedSeatNumbers.length * 100).toLocaleString()} FCFA
                </span>
                <input
                  type="checkbox"
                  checked={insuranceOptIn}
                  onChange={(e) => setInsuranceOptIn(e.target.checked)}
                  className="w-4 h-4 accent-[#008751]"
                />
              </div>
            </label>
          </Card>

          {/* Récapitulatif Total & Bouton de confirmation */}
          <div className="sticky bottom-20 bg-white p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between z-20">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">
                Total Récapitulatif
              </span>
              <span className="text-lg font-black text-slate-900">
                {totals.total.toLocaleString()} FCFA
              </span>
            </div>

            <Button
              variant="accent"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleConfirmBooking}
              className="font-black"
            >
              Valider la réservation
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================
          ÉTAPE 5 : CONFIRMATION DE RÉSERVATION RÉUSSIE
         ======================================================== */}
      {step === 'SUMMARY' && createdBooking && (
        <div className="space-y-4 animate-fadeIn text-center">
          <Card variant="elevated" className="p-6 space-y-4 border-emerald-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <Badge variant="success" size="md">
                RÉSERVATION ENREGISTRÉE AVEC SUCCÈS
              </Badge>
              <h2 className="text-lg font-black text-slate-900 mt-2 font-mono">
                {createdBooking.booking_reference}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Votre dossier est sauvegardé sur les serveurs TSR. Vous disposez de 15 minutes pour finaliser le règlement.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Trajet :</span>
                <span className="font-bold text-slate-800">
                  {selectedTrip.originStation.name} → {selectedTrip.destinationStation.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sièges réservés :</span>
                <span className="font-bold text-slate-800">{selectedSeatNumbers.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact :</span>
                <span className="font-bold text-slate-800">{createdBooking.purchaser_phone}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm">
                <span>Montant à régler :</span>
                <span className="text-[#008751]">{createdBooking.total_amount.toLocaleString()} FCFA</span>
              </div>
            </div>

            <Button
              variant="accent"
              fullWidth
              size="lg"
              onClick={() => setIsPaymentModalOpen(true)}
              className="font-black text-slate-900 shadow-md"
            >
              💳 Payer par Mobile Money ({createdBooking.total_amount.toLocaleString()} FCFA)
            </Button>

            <button
              type="button"
              onClick={() => onBookingSuccess(createdBooking.booking_reference)}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Voir la réservation sans payer immédiatement →
            </button>
          </Card>

          {isPaymentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200">
                <PaymentModal
                  booking={createdBooking}
                  onPaymentSuccess={() => {
                    setIsPaymentModalOpen(false);
                    onBookingSuccess(createdBooking.booking_reference);
                  }}
                  onCancel={() => setIsPaymentModalOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

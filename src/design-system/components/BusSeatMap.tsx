/**
 * TSR APP v1.0 — Composant BusSeatMap (Plan Interactif de Car 70 Places)
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { useMemo } from 'react';
import { Armchair, Compass, AlertCircle, Clock } from 'lucide-react';
import { SeatWithStatus } from '../../backend/models';

interface BusSeatMapProps {
  seats: SeatWithStatus[];
  selectedSeatNumbers: number[];
  onToggleSeat: (seatNumber: number) => void;
  isLoading?: boolean;
  concurrencyError?: string | null;
}

export function BusSeatMap({
  seats,
  selectedSeatNumbers,
  onToggleSeat,
  isLoading = false,
  concurrencyError,
}: BusSeatMapProps) {
  // Organisation des 70 sièges par rangées (18 rangées de 4 + banquette arrière de 2 = 70 places)
  const rows = useMemo(() => {
    const rowMap = new Map<number, SeatWithStatus[]>();
    seats.forEach((seat) => {
      const existing = rowMap.get(seat.rowIndex) || [];
      existing.push(seat);
      rowMap.set(seat.rowIndex, existing);
    });
    return Array.from(rowMap.entries()).sort(([a], [b]) => a - b);
  }, [seats]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Légende officielle TSR */}
      <div className="w-full max-w-md bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 text-center">
          Légende du Car TSR (70 Places)
        </h4>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
            <span className="text-slate-700">🟢 Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shrink-0" />
            <span className="text-slate-700">🔴 Occupé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400 shrink-0" />
            <span className="text-slate-700">🟡 VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-600 shrink-0" />
            <span className="text-slate-700">🔵 Choisi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-orange-500 shrink-0" />
            <span className="text-slate-700">🟠 Verrouillé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-700 shrink-0" />
            <span className="text-slate-700">⚫ Équipage</span>
          </div>
        </div>
      </div>

      {concurrencyError && (
        <div className="w-full max-w-md mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{concurrencyError}</span>
        </div>
      )}

      {/* Structure visuelle du Car TSR */}
      <div className="w-full max-w-xs sm:max-w-sm bg-slate-100 p-4 sm:p-5 rounded-[40px] border-4 border-slate-300 shadow-xl relative">
        {/* Pare-brise & Cabine chauffeur */}
        <div className="w-full h-16 bg-slate-800 rounded-t-[32px] mb-4 flex items-center justify-between px-6 text-white text-xs font-bold shadow-inner">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Compass className="w-4 h-4 text-[#fcd116]" />
            <span>Chauffeur</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center font-black text-[10px] text-[#fcd116]">
            TSR
          </div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <span>Porte</span> →
          </div>
        </div>

        {/* Allée et rangées */}
        <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto px-1 py-1">
          {rows.map(([rowIndex, rowSeats]) => {
            const leftSeats = rowSeats.filter((s) => s.colIndex === 0 || s.colIndex === 1);
            const rightSeats = rowSeats.filter((s) => s.colIndex === 2 || s.colIndex === 3);

            return (
              <div key={rowIndex} className="flex items-center justify-between gap-1">
                {/* 2 sièges côté gauche (Fenêtre & Couloir) */}
                <div className="flex gap-1.5">
                  {leftSeats.map((seat) => renderSeatButton(seat, selectedSeatNumbers, onToggleSeat))}
                </div>

                {/* Allée centrale */}
                <div className="flex-1 flex justify-center text-[10px] font-black text-slate-400 select-none">
                  {rowIndex}
                </div>

                {/* 2 sièges côté droit (Couloir & Fenêtre) */}
                <div className="flex gap-1.5">
                  {rightSeats.map((seat) => renderSeatButton(seat, selectedSeatNumbers, onToggleSeat))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrière du car */}
        <div className="w-full h-6 bg-slate-300 rounded-b-2xl mt-4 flex items-center justify-center text-[10px] font-bold text-slate-600">
          Moteur & Arrière du Car
        </div>
      </div>
    </div>
  );
}

function renderSeatButton(
  seat: SeatWithStatus,
  selectedSeatNumbers: number[],
  onToggleSeat: (num: number) => void
) {
  const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
  const isBooked = seat.status === 'BOOKED';
  const isLockedByOther = seat.status === 'LOCKED' && !isSelected;
  const isCrew = seat.tier === 'CREW_RESERVED';
  const isVip = seat.tier === 'VIP';

  let bgColor = 'bg-emerald-500 hover:bg-emerald-600 text-white';
  let cursor = 'cursor-pointer active:scale-95';

  if (isCrew) {
    bgColor = 'bg-slate-700 text-slate-300 cursor-not-allowed';
  } else if (isBooked) {
    bgColor = 'bg-rose-500 text-white cursor-not-allowed';
  } else if (isLockedByOther) {
    bgColor = 'bg-orange-500 text-white cursor-not-allowed animate-pulse';
  } else if (isSelected) {
    bgColor = 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1 font-black';
  } else if (isVip) {
    bgColor = 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold';
  }

  return (
    <button
      key={seat.seatNumber}
      type="button"
      onClick={() => onToggleSeat(seat.seatNumber)}
      disabled={isBooked || isCrew || isLockedByOther}
      title={`Siège ${seat.seatNumber} (${seat.label}) - ${seat.tier} - ${seat.price} FCFA`}
      className={`
        w-8 h-9 sm:w-9 sm:h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold shadow-xs transition-all duration-150 select-none
        ${bgColor} ${cursor}
      `}
    >
      <Armchair className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span className="leading-none mt-0.5">{seat.seatNumber}</span>
    </button>
  );
}

/**
 * TSR APP v1.0 — Modal & Vue des Gares TSR
 * Géolocalisation, distance en km, coordonnées GPS et lien itinéraire
 */
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { StationService } from '../../backend/services';

interface StationListModalProps {
  onSelectStation?: (stationId: string) => void;
  onClose: () => void;
}

export function StationListModal({ onSelectStation, onClose }: StationListModalProps) {
  const stations = StationService.getStationsWithDistance();

  return (
    <div className="space-y-4">
      {/* Simulation visuelle de la carte du Burkina Faso */}
      <div className="relative w-full h-44 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex flex-col justify-between p-3 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fcd116_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-amber-300">
            🗺 Réseau TSR au Burkina Faso
          </div>
          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700 font-bold">
            4 Gares Connectées
          </span>
        </div>

        {/* Repères cartographiques des villes */}
        <div className="relative z-10 grid grid-cols-2 gap-2 text-center text-xs font-black">
          <div className="bg-emerald-800/80 p-1.5 rounded-xl border border-emerald-500/50">
            📍 Ouagadougou (Centre)
          </div>
          <div className="bg-emerald-800/80 p-1.5 rounded-xl border border-emerald-500/50">
            📍 Bobo-Dioulasso (Ouest)
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-600">
            📍 Koudougou (RN1)
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-600">
            📍 Ouahigouya (Nord)
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-slate-400 text-center">
          OpenStreetMap / Google Maps Platform API
        </div>
      </div>

      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {stations.map((st) => (
          <div
            key={st.id}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#008751] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{st.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{st.address}</p>
                </div>
              </div>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200">
                {st.distanceKm} km
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {st.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {st.opening_time.slice(0, 5)} - {st.closing_time.slice(0, 5)}
                </span>
              </div>
              <div className="flex gap-1.5">
                <a
                  href={st.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008751] hover:underline"
                >
                  <Navigation className="w-3 h-3" /> Itinéraire
                </a>
                {onSelectStation && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => {
                      onSelectStation(st.id);
                      onClose();
                    }}
                  >
                    Choisir
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

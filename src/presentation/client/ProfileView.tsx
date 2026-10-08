/**
 * TSR APP v1.0 — Vue Profil & Fidélité Client
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { User, Award, Globe, Shield, LogOut, Phone, CreditCard, ChevronRight, HelpCircle } from 'lucide-react';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { useI18n, Language } from '../../design-system/i18n';
import { db } from '../../backend/mock-db';

interface ProfileViewProps {
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  onLogout: () => void;
}

export function ProfileView({ currentUser, onLogout }: ProfileViewProps) {
  const { lang, setLang, t } = useI18n();
  const loyalty = db.loyaltyAccounts[0] || { completed_trips_count: 9, eligible_for_discount: false };

  const tripsCount = loyalty.completed_trips_count;
  const target = 10;
  const progressPercent = Math.min(100, Math.round((tripsCount / target) * 100));

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fadeIn">
      {/* Carte identité utilisateur */}
      <Card variant="elevated" className="flex items-center gap-3.5 p-4 border-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-[#008751] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
          {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : 'JP'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900 truncate">
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Jean-Paul Yaméogo'}
            </h2>
            <Badge variant="vip" size="sm">
              GOLD
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            {currentUser?.phoneNumber || '+226 76 54 32 10'}
          </p>
        </div>
      </Card>

      {/* Programme Fidélité TSR Transport (10 voyages = 11e à -50%) */}
      <Card variant="highlight" className="p-4 space-y-3 bg-gradient-to-br from-emerald-50 to-amber-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Programme Fidélité TSR
              </h3>
              <span className="text-[10px] text-emerald-800 font-bold block">
                10 voyages effectués = 11ᵉ voyage à -50%
              </span>
            </div>
          </div>
          <span className="text-xs font-black text-[#008751] bg-white px-2 py-1 rounded-lg border border-emerald-200">
            {tripsCount} / {target}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#008751] to-[#fcd116] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 font-semibold text-right">
            {tripsCount >= 10
              ? '🎉 Félicitations ! Votre réduction de -50% est disponible sur votre prochain voyage.'
              : `Plus que ${target - tripsCount} voyage pour débloquer votre réduction de -50% !`}
          </p>
        </div>
      </Card>

      {/* Sélecteur de Langue (Français & Mooré) */}
      <Card variant="default" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <Globe className="w-4 h-4 text-[#008751]" />
            <span>Langue de l'application / Gom-biiga</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLang('fr')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'fr' ? 'bg-white text-[#008751] shadow-xs' : 'text-slate-600'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setLang('moo')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'moo' ? 'bg-white text-[#008751] shadow-xs' : 'text-slate-600'
              }`}
            >
              Mooré
            </button>
          </div>
        </div>
      </Card>

      {/* Règle d'annulation et retenue de 10% */}
      <Card variant="default" className="p-4 space-y-2 text-xs">
        <h4 className="font-black text-slate-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
          <Shield className="w-4 h-4 text-[#008751]" />
          Conditions d'Annulation & Remboursement
        </h4>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Conformément au règlement de TSR Transport, les annulations signalées avant le départ bénéficient d'un remboursement immédiat avec application de la retenue contractuelle de 10%.
        </p>
      </Card>

      {/* Bouton de déconnexion */}
      <Button
        variant="ghost"
        fullWidth
        onClick={onLogout}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        leftIcon={<LogOut className="w-4 h-4" />}
      >
        Se déconnecter de la session
      </Button>
    </div>
  );
}

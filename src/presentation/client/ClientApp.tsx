/**
 * TSR APP v1.0 — Application Client Complète (PWA / Mobile)
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { useState } from 'react';
import { Home, Ticket as TicketIcon, User, MapPin, Globe, Bus } from 'lucide-react';
import { AuthScreens } from './AuthScreens';
import { BookingFlow } from './BookingFlow';
import { TicketsView } from './TicketsView';
import { ProfileView } from './ProfileView';
import { StationListModal } from './StationListModal';
import { Modal } from '../../design-system/components/Modal';
import { useI18n } from '../../design-system/i18n';

export function ClientApp() {
  const { lang, setLang, t } = useI18n();

  // Session & Utilisateur
  const [session, setSession] = useState<{
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    } | null;
  } | null>({
    token: 'SESSION-CLIENT-DEMO-01',
    user: {
      id: 'usr-client-01',
      firstName: 'Jean-Paul',
      lastName: 'Yaméogo',
      phoneNumber: '+22676543210',
    },
  });

  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Onglet courant : 'HOME' | 'TICKETS' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<'HOME' | 'TICKETS' | 'PROFILE'>('HOME');

  // Modal carte des gares
  const [isStationModalOpen, setIsStationModalOpen] = useState<boolean>(false);

  // Si pas de session et pas en mode visiteur -> Écrans d'authentification
  if (!session && !isGuest) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
          <AuthScreens
            onAuthSuccess={(newSession) => {
              setSession(newSession);
              setIsGuest(false);
            }}
            onContinueAsGuest={() => setIsGuest(true)}
          />
        </div>
      </div>
    );
  }

  const sessionToken = session?.token || 'SESSION-GUEST-GUEST';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 pb-20 select-none">
      {/* Conteneur Mobile Responsive (Simulation Smartphone / PWA) */}
      <div className="w-full max-w-md bg-[#f8fafc] min-h-screen shadow-2xl flex flex-col border-x border-slate-200">
        {/* Entête TopBar TSR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008751] to-[#00a865] flex items-center justify-center font-black text-white text-xs shadow-sm border border-[#fcd116]">
              TSR
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {t('welcome_greeting')}
              </div>
              <div className="text-sm font-black text-slate-900 leading-tight">
                {session?.user ? session.user.firstName : 'Voyageur'} 👋
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsStationModalOpen(true)}
              className="p-2 text-[#008751] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              title="Gares TSR au Burkina Faso"
            >
              <MapPin className="w-4 h-4" />
            </button>

            <button
              onClick={() => setLang(lang === 'fr' ? 'moo' : 'fr')}
              className="px-2.5 py-1 text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Changer de langue (Français / Mooré)"
            >
              <Globe className="w-3.5 h-3.5 text-[#008751]" />
              <span>{lang.toUpperCase()}</span>
            </button>
          </div>
        </header>

        {/* Contenu Principal selon l'onglet actif */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'HOME' && (
            <BookingFlow
              sessionToken={sessionToken}
              currentUser={session?.user || undefined}
              onBookingSuccess={() => setActiveTab('TICKETS')}
              onOpenStationMap={() => setIsStationModalOpen(true)}
            />
          )}

          {activeTab === 'TICKETS' && (
            <TicketsView
              userPhone={session?.user?.phoneNumber}
              onBookNewTrip={() => setActiveTab('HOME')}
            />
          )}

          {activeTab === 'PROFILE' && (
            <ProfileView
              currentUser={session?.user || undefined}
              onLogout={() => {
                setSession(null);
                setIsGuest(false);
              }}
            />
          )}
        </main>

        {/* Barre de Navigation Basse Mobile (Bottom Navigation) */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex justify-around items-center z-40 shadow-lg">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'HOME'
                ? 'text-[#008751] font-black scale-105'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'HOME' ? 'bg-emerald-50' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide">{t('nav_home')}</span>
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'TICKETS'
                ? 'text-[#008751] font-black scale-105'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'TICKETS' ? 'bg-emerald-50' : ''}`}>
              <TicketIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide">{t('nav_tickets')}</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'PROFILE'
                ? 'text-[#008751] font-black scale-105'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeTab === 'PROFILE' ? 'bg-emerald-50' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-wide">{t('nav_profile')}</span>
          </button>
        </nav>

        {/* Modal de la Carte & Liste des Gares */}
        <Modal
          isOpen={isStationModalOpen}
          onClose={() => setIsStationModalOpen(false)}
          title="Gares TSR au Burkina Faso"
        >
          <StationListModal
            onClose={() => setIsStationModalOpen(false)}
            onSelectStation={() => setIsStationModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

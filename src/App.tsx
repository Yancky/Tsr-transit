/**
 * TSR APP v1.0 — Architecture Complète Multi-Applications
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { useState } from 'react';
import { Smartphone, ShieldCheck, LayoutDashboard, CheckSquare, Sparkles } from 'lucide-react';
import { I18nProvider } from './design-system/i18n';
import { FirebaseProvider } from './firebase/FirebaseContext';
import { ClientApp } from './presentation/client/ClientApp';
import { AgentApp } from './presentation/agent/AgentApp';
import { DashboardApp } from './presentation/dashboard/DashboardApp';
import { TestSuiteModal } from './presentation/qa/TestSuiteModal';
import { Modal } from './design-system/components/Modal';

export default function App() {
  // Commutateur d'application pour tester en direct l'ensemble des livrables
  const [currentApp, setCurrentApp] = useState<'CLIENT' | 'AGENT' | 'DASHBOARD'>('CLIENT');
  const [isQaModalOpen, setIsQaModalOpen] = useState<boolean>(false);

  return (
    <I18nProvider>
      <FirebaseProvider>
        <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
          {/* Bandeau Supérieur de Navigation Multi-Applications TSR */}
          <div className="bg-slate-950 text-white px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black tracking-wide text-[#fcd116]">
                TSR APP v1.0
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Burkina Faso • Firebase Cloud Connecté 🔥
              </span>
            </div>

          {/* Commutateur des 3 Applications du cahier des charges */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              onClick={() => setCurrentApp('CLIENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentApp === 'CLIENT'
                  ? 'bg-[#008751] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Client Mobile</span>
            </button>

            <button
              onClick={() => setCurrentApp('AGENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentApp === 'AGENT'
                  ? 'bg-[#008751] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Agent Scanner</span>
            </button>

            <button
              onClick={() => setCurrentApp('DASHBOARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentApp === 'DASHBOARD'
                  ? 'bg-[#008751] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-300" />
              <span>Dashboard Web</span>
            </button>
          </div>

          {/* Bouton de la suite de tests QA */}
          <button
            onClick={() => setIsQaModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#fcd116]" />
            <span>Suite QA (6 Tests)</span>
          </button>
        </div>

        {/* Affichage de l'application active */}
        <div className="flex-1 flex flex-col">
          {currentApp === 'CLIENT' && <ClientApp />}
          {currentApp === 'AGENT' && <AgentApp />}
          {currentApp === 'DASHBOARD' && <DashboardApp />}
        </div>

        {/* Modal de la Suite de Tests QA */}
        <Modal
          isOpen={isQaModalOpen}
          onClose={() => setIsQaModalOpen(false)}
          title="Validation QA & Sécurité TSR"
          maxWidth="lg"
        >
          <TestSuiteModal onClose={() => setIsQaModalOpen(false)} />
        </Modal>
      </div>
      </FirebaseProvider>
    </I18nProvider>
  );
}

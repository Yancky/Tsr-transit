/**
 * TSR APP v1.0 — Écrans d'Authentification & Onboarding Client
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { useState, useEffect } from 'react';
import { Bus, ArrowRight, ShieldCheck, Phone, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Alert } from '../../design-system/components/Alert';
import { ApiController } from '../../backend/controllers';
import { useI18n } from '../../design-system/i18n';

interface AuthScreensProps {
  onAuthSuccess: (session: { token: string; user: any }) => void;
  onContinueAsGuest: () => void;
}

export function AuthScreens({ onAuthSuccess, onContinueAsGuest }: AuthScreensProps) {
  const { t } = useI18n();

  // Écrans : 'SPLASH' | 'WELCOME' | 'LOGIN' | 'REGISTER' | 'OTP'
  const [view, setView] = useState<'SPLASH' | 'WELCOME' | 'LOGIN' | 'REGISTER' | 'OTP'>('SPLASH');

  // Champs de saisie
  const [phone, setPhone] = useState<string>('76543210');
  const [firstName, setFirstName] = useState<string>('Jean-Paul');
  const [lastName, setLastName] = useState<string>('Yaméogo');
  const [otpCode, setOtpCode] = useState<string>('123456');

  // États de chargement et erreurs
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);

  // Redirection automatique Splash après 2 secondes (avec possibilité de passer immédiatement)
  useEffect(() => {
    if (view === 'SPLASH') {
      const timer = setTimeout(() => {
        setView('WELCOME');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Envoi OTP pour Connexion
  const handleSendLoginOtp = () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = ApiController.sendOtp(phone);
      setOtpInfo(res.message);
      setView('OTP');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’envoi de l’OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Envoi OTP pour Inscription
  const handleRegister = () => {
    setError(null);
    setIsLoading(true);
    try {
      // Valider inscription d'abord
      ApiController.register({ phone, firstName, lastName });
      const res = ApiController.sendOtp(phone);
      setOtpInfo(res.message);
      setView('OTP');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validation finale du code OTP
  const handleVerifyOtp = () => {
    setError(null);
    setIsLoading(true);
    try {
      const session = ApiController.loginWithOtp(phone, otpCode);
      onAuthSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Code OTP invalide. Entrez 123456 pour le test.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================
  // ÉCRAN 1 : SPLASH SCREEN TSR TRANSPORT
  // ========================================================
  if (view === 'SPLASH') {
    return (
      <div className="flex flex-col items-center justify-between min-h-[500px] py-12 px-6 text-center select-none animate-fadeIn">
        <div className="w-full flex justify-end">
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            v1.0 Burkina Faso
          </span>
        </div>

        <div className="space-y-4 my-auto">
          {/* Logo TSR emblématique */}
          <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#008751] to-[#00a865] flex items-center justify-center shadow-2xl border-4 border-[#fcd116] transform animate-bounce">
            <Bus className="w-12 h-12 text-white" />
            <div className="absolute -bottom-2 -right-2 bg-[#fcd116] text-[#0f172a] text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
              TSR
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              TSR Transport
            </h1>
            <p className="text-sm font-bold text-[#008751] mt-1 italic">
              "Votre voyage, notre priorité."
            </p>
          </div>

          <div className="w-10 h-1 bg-[#fcd116] mx-auto rounded-full" />
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setView('WELCOME')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Démarrer l'application
          </Button>
          <p className="text-[11px] text-slate-400">
            Société de Transport TSR Transport — Burkina Faso
          </p>
        </div>
      </div>
    );
  }

  // ========================================================
  // ÉCRAN 2 : BIENVENUE
  // ========================================================
  if (view === 'WELCOME') {
    return (
      <div className="space-y-6 py-6 px-4 animate-fadeIn max-w-sm mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
          <Bus className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">Bienvenue sur TSR</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Achetez vos billets interurbains en ligne, réservez votre siège et embarquez rapidement par QR Code.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setView('LOGIN')}
          >
            {t('btn_login')}
          </Button>

          <Button
            variant="outline"
            fullWidth
            size="lg"
            onClick={() => setView('REGISTER')}
          >
            {t('btn_register')}
          </Button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {t('btn_continue_guest')} →
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // ÉCRAN 3 : CONNEXION PAR TÉLÉPHONE
  // ========================================================
  if (view === 'LOGIN') {
    return (
      <div className="space-y-5 py-4 px-4 animate-fadeIn max-w-sm mx-auto">
        <button
          onClick={() => setView('WELCOME')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          ← Retour
        </button>

        <div>
          <h2 className="text-xl font-black text-slate-900">Connexion Voyageur</h2>
          <p className="text-xs text-slate-500 mt-1">
            Entrez votre numéro de téléphone burkinabè pour recevoir un code OTP.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <Card variant="elevated" className="space-y-4">
          <Input
            isPhoneBurkina
            label="Numéro de Téléphone"
            placeholder="70 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button
            variant="accent"
            fullWidth
            size="lg"
            isLoading={isLoading}
            onClick={handleSendLoginOtp}
          >
            Recevoir mon code OTP
          </Button>
        </Card>

        <p className="text-xs text-center text-slate-500">
          Pas encore de compte ?{' '}
          <button
            onClick={() => setView('REGISTER')}
            className="font-bold text-[#008751] hover:underline"
          >
            Créer un compte
          </button>
        </p>
      </div>
    );
  }

  // ========================================================
  // ÉCRAN 4 : INSCRIPTION CLIENT
  // ========================================================
  if (view === 'REGISTER') {
    return (
      <div className="space-y-5 py-4 px-4 animate-fadeIn max-w-sm mx-auto">
        <button
          onClick={() => setView('WELCOME')}
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          ← Retour
        </button>

        <div>
          <h2 className="text-xl font-black text-slate-900">Nouveau Voyageur</h2>
          <p className="text-xs text-slate-500 mt-1">
            Créez votre profil pour cumuler vos points de fidélité et retrouver vos billets.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <Card variant="elevated" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Prénom"
              placeholder="Jean-Paul"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Nom"
              placeholder="Yaméogo"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            isPhoneBurkina
            label="Numéro de Téléphone"
            placeholder="76 54 32 10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button
            variant="accent"
            fullWidth
            size="lg"
            isLoading={isLoading}
            onClick={handleRegister}
          >
            Valider et continuer
          </Button>
        </Card>

        <p className="text-xs text-center text-slate-500">
          Déjà inscrit ?{' '}
          <button
            onClick={() => setView('LOGIN')}
            className="font-bold text-[#008751] hover:underline"
          >
            Se connecter
          </button>
        </p>
      </div>
    );
  }

  // ========================================================
  // ÉCRAN 5 : VÉRIFICATION OTP
  // ========================================================
  return (
    <div className="space-y-5 py-4 px-4 animate-fadeIn max-w-sm mx-auto text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
        <KeyRound className="w-7 h-7" />
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-900">Vérification OTP</h2>
        <p className="text-xs text-slate-500 mt-1">
          Code envoyé par SMS au <strong className="text-slate-800">+226 {phone}</strong>
        </p>
      </div>

      {otpInfo && <Alert type="success">{otpInfo} (Code démo : <strong>123456</strong>)</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <Card variant="elevated" className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Code à 6 chiffres
          </label>
          <input
            type="text"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            className="w-full h-14 text-center tracking-[0.4em] font-mono text-2xl font-black bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-[#008751] focus:ring-2 focus:ring-[#008751]/20 focus:outline-none"
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isLoading}
          onClick={handleVerifyOtp}
        >
          Confirmer et Accéder à TSR
        </Button>
      </Card>

      <button
        type="button"
        onClick={handleSendLoginOtp}
        className="text-xs font-bold text-[#008751] hover:underline cursor-pointer"
      >
        Renvoyer le code SMS
      </button>
    </div>
  );
}

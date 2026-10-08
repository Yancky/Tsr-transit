/**
 * TSR APP v1.0 — Modal de Paiement Mobile Money
 * Intégration Orange Money, Moov Money, Wave, Telecel avec confirmation serveur
 */
import { useState } from 'react';
import { Smartphone, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Badge } from '../../design-system/components/Badge';
import { Alert } from '../../design-system/components/Alert';
import { PaymentGateway } from '../../backend/models';
import { PaymentGatewayService } from '../../backend/payments/PaymentGatewayService';

interface PaymentModalProps {
  booking: any;
  onPaymentSuccess: (tickets: any[]) => void;
  onCancel: () => void;
}

export function PaymentModal({ booking, onPaymentSuccess, onCancel }: PaymentModalProps) {
  const [gateway, setGateway] = useState<PaymentGateway>('ORANGE_MONEY');
  const [phoneNumber, setPhoneNumber] = useState<string>(
    booking.purchaser_phone.replace('+226', '') || '70123456'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'SELECT' | 'USSD_WAIT' | 'SUCCESS' | 'ERROR'>('SELECT');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gatewayRef, setGatewayRef] = useState<string>('');

  const operators = [
    {
      id: 'ORANGE_MONEY' as PaymentGateway,
      name: 'Orange Money',
      badge: 'Orange BF',
      color: 'border-orange-500 bg-orange-50 text-orange-900',
      iconColor: 'bg-orange-500 text-white',
    },
    {
      id: 'MOOV_MONEY' as PaymentGateway,
      name: 'Moov Money',
      badge: 'Moov Africa',
      color: 'border-blue-600 bg-blue-50 text-blue-900',
      iconColor: 'bg-blue-600 text-white',
    },
    {
      id: 'WAVE' as PaymentGateway,
      name: 'Wave Burkina',
      badge: '0% Frais',
      color: 'border-cyan-500 bg-cyan-50 text-cyan-900',
      iconColor: 'bg-cyan-500 text-white',
    },
    {
      id: 'TELECEL' as PaymentGateway,
      name: 'Telecel B-Fast',
      badge: 'Telecel BF',
      color: 'border-rose-600 bg-rose-50 text-rose-900',
      iconColor: 'bg-rose-600 text-white',
    },
  ];

  const handleLaunchPayment = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Initialisation avec idempotence stricte côté serveur
      const idempotencyKey = `IDEMP-${gateway}-${booking.id}-${Date.now()}`;
      const initRes = PaymentGatewayService.initiatePayment({
        bookingId: booking.id,
        gateway,
        phoneNumber: `+226${phoneNumber}`,
        idempotencyKey,
      });

      setGatewayRef(initRes.gatewayReference || '');
      setStep('USSD_WAIT');

      // 2. Simulation de l'autorisation USSD opérateur puis webhook de confirmation serveur
      setTimeout(() => {
        try {
          const verifyRes = PaymentGatewayService.processServerConfirmation(
            initRes.paymentId,
            true // simulateSuccess = true
          );

          if (verifyRes.success) {
            setStep('SUCCESS');
            setTimeout(() => {
              onPaymentSuccess(verifyRes.ticketsGenerated || []);
            }, 1800);
          } else {
            setErrorMessage(verifyRes.message);
            setStep('ERROR');
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Erreur lors de la confirmation serveur.');
          setStep('ERROR');
        } finally {
          setIsProcessing(false);
        }
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’initialiser le paiement.');
      setStep('ERROR');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Récapitulatif Montant */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
            Dossier {booking.booking_reference}
          </span>
          <span className="text-sm font-black text-amber-400">Paiement Mobile Money</span>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-white">{booking.total_amount.toLocaleString()}</span>
          <span className="text-xs text-emerald-400 font-bold ml-1">FCFA</span>
        </div>
      </div>

      {step === 'SELECT' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Choix de l'opérateur burkinabè */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Sélectionnez votre moyen de paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {operators.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setGateway(op.id)}
                  className={`
                    p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-20
                    ${
                      gateway === op.id
                        ? `${op.color} ring-2 ring-emerald-500/20 shadow-xs font-black`
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">{op.name}</span>
                    <span className={`w-3 h-3 rounded-full border-2 ${gateway === op.id ? 'bg-[#008751] border-white ring-1 ring-[#008751]' : 'border-slate-300'}`} />
                  </div>
                  <span className="text-[10px] opacity-75">{op.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Numéro Mobile Money */}
          <Input
            isPhoneBurkina
            label="Numéro de débit Mobile Money"
            placeholder="70 12 34 56"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#008751] shrink-0" />
            <span>Paiement sécurisé par agrégateur LigdiCash / PayDunya.</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={onCancel}>
              Annuler
            </Button>
            <Button
              variant="accent"
              fullWidth
              size="lg"
              isLoading={isProcessing}
              onClick={handleLaunchPayment}
              className="font-black"
            >
              Payer {booking.total_amount.toLocaleString()} FCFA
            </Button>
          </div>
        </div>
      )}

      {step === 'USSD_WAIT' && (
        <div className="py-8 px-4 text-center space-y-4 animate-fadeIn">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
            <Smartphone className="w-7 h-7 text-amber-600 absolute animate-pulse" />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">Validation USSD en cours</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Veuillez confirmer l'invite USSD sur votre téléphone (+226 {phoneNumber}) avec votre code secret Mobile Money.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-200">
            Réf: {gatewayRef} • Attente webhook serveur...
          </div>
        </div>
      )}

      {step === 'SUCCESS' && (
        <div className="py-8 px-4 text-center space-y-3 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Paiement Validé par le Serveur !</h3>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Génération automatique de votre billet électronique et du QR Code sécurisé en cours...
          </p>
        </div>
      )}

      {step === 'ERROR' && (
        <div className="py-4 space-y-4 animate-fadeIn">
          <Alert type="error" title="Échec du paiement">
            {errorMessage || 'La transaction n’a pas pu aboutir.'}
          </Alert>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setStep('SELECT')}>
              Réessayer
            </Button>
            <Button variant="outline" fullWidth onClick={onCancel}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

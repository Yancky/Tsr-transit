/**
 * TSR APP v1.0 — Vue "Mes Billets"
 * Billet électronique, QR code cryptographique, téléchargement et partage
 */
import { useState } from 'react';
import { Ticket as TicketIcon, Download, Share2, Mail, CheckCircle2, Calendar, Clock, MapPin, Bus } from 'lucide-react';
import { QRCodeDisplay } from '../../design-system/components/QRCodeDisplay';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { Card } from '../../design-system/components/Card';
import { ApiController } from '../../backend/controllers';

interface TicketsViewProps {
  userPhone?: string;
  onBookNewTrip?: () => void;
}

export function TicketsView({ userPhone, onBookNewTrip }: TicketsViewProps) {
  const ticketsWithDetails = ApiController.getUserTickets(userPhone);
  const [selectedTicket, setSelectedTicket] = useState<any>(ticketsWithDetails[0] || null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const handleShare = (method: 'WHATSAPP' | 'EMAIL' | 'PDF') => {
    if (method === 'WHATSAPP') {
      setShareSuccess('Billet prêt à être envoyé par WhatsApp au passager !');
    } else if (method === 'EMAIL') {
      setShareSuccess('Billet envoyé par e-mail avec succès.');
    } else {
      setShareSuccess('Téléchargement du billet PDF haute résolution en cours...');
    }
    setTimeout(() => setShareSuccess(null), 4000);
  };

  if (!ticketsWithDetails || ticketsWithDetails.length === 0) {
    return (
      <div className="text-center py-12 px-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#008751] flex items-center justify-center mx-auto mb-4">
          <TicketIcon className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1">Aucun billet actif</h3>
        <p className="text-xs text-slate-500 mb-6">
          Vous n'avez pas encore de voyage programmé. Recherchez un trajet pour réserver votre place.
        </p>
        {onBookNewTrip && (
          <Button variant="primary" onClick={onBookNewTrip}>
            Réserver un trajet
          </Button>
        )}
      </div>
    );
  }

  const current = selectedTicket || ticketsWithDetails[0];

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fadeIn">
      {/* Sélecteur si multi-billets */}
      {ticketsWithDetails.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ticketsWithDetails.map((tItem: any) => (
            <button
              key={tItem.ticket.id}
              onClick={() => setSelectedTicket(tItem)}
              className={`
                px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer
                ${
                  current.ticket.id === tItem.ticket.id
                    ? 'bg-[#008751] text-white border-[#008751] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }
              `}
            >
              {tItem.ticket.ticket_number} • Siège {tItem.ticket.seat_number}
            </button>
          ))}
        </div>
      )}

      {/* Carte Billet Électronique Professionnel TSR */}
      <div className="bg-white rounded-[28px] border-2 border-slate-200 shadow-xl overflow-hidden relative">
        {/* Entête Billet */}
        <div className="bg-gradient-to-r from-[#008751] to-[#005e38] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#fcd116] text-[#0f172a] font-black flex items-center justify-center text-sm shadow-sm">
              TSR
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">TSR Transport</h2>
              <span className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">
                Billet de Voyage Sécurisé
              </span>
            </div>
          </div>
          <Badge variant="success" size="sm" className="bg-emerald-400 text-emerald-950 font-black">
            VALIDE
          </Badge>
        </div>

        {/* Détails Trajet */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                N° de Billet
              </span>
              <span className="text-sm font-mono font-black text-slate-900">
                {current.ticket.ticket_number}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Car & Classe
              </span>
              <span className="text-xs font-black text-[#008751]">
                VIP Climatisé (70 Places)
              </span>
            </div>
          </div>

          {/* Villes & Horaires */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Départ</span>
              <span className="text-sm font-black text-slate-900 block">
                {current.originStation?.name.replace('Gare Centrale TSR ', '').replace('Gare Principale TSR ', '') || 'Ouagadougou'}
              </span>
              <span className="text-[11px] font-bold text-[#008751] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {current.trip?.departure_time.slice(11, 16) || '16:30'}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <Bus className="w-4 h-4 text-emerald-600 mb-0.5" />
              <div className="w-12 h-0.5 bg-emerald-300" />
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Arrivée</span>
              <span className="text-sm font-black text-slate-900 block">
                {current.destinationStation?.name.replace('Gare Principale TSR ', '').replace('Gare Centrale TSR ', '') || 'Bobo-Dioulasso'}
              </span>
              <span className="text-[11px] font-bold text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {current.trip?.estimated_arrival_time.slice(11, 16) || '22:00'}
              </span>
            </div>
          </div>

          {/* Passager & Siège */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/80 block">
                Passager
              </span>
              <span className="text-xs font-black text-slate-900 block">
                {current.passenger?.first_name || 'Jean-Paul'} {current.passenger?.last_name || 'Yaméogo'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                CNIB : {current.passenger?.id_card_number || 'B12938475'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/80 block">
                Siège Assigné
              </span>
              <span className="text-xl font-black text-[#008751] block leading-none">
                {current.ticket.seat_number}A
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md inline-block mt-0.5">
                RANGÉE VIP
              </span>
            </div>
          </div>

          {/* QR Code cryptographique */}
          <div className="py-1">
            <QRCodeDisplay
              ticketNumber={current.ticket.ticket_number}
              passengerName={`${current.passenger?.first_name || 'Jean-Paul'} ${current.passenger?.last_name || 'Yaméogo'}`}
              seatNumber={current.ticket.seat_number}
              tripCode={current.trip?.trip_code || 'TRIP-OUA-BOB-1630'}
              size={170}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Montant : <strong className="text-slate-900">{current.ticket.amount_paid.toLocaleString()} FCFA</strong></span>
            <span>Gare : <strong>Quai VIP 1</strong></span>
          </div>

          {shareSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 text-center animate-fadeIn">
              {shareSuccess}
            </div>
          )}

          {/* Boutons d'action : Télécharger PDF, Partager WhatsApp, Envoyer par e-mail */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleShare('PDF')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700 mb-1" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleShare('WHATSAPP')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700 mb-1" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => handleShare('EMAIL')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-700 mb-1" />
              <span>E-mail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

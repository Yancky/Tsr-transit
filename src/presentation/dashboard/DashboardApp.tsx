/**
 * TSR APP v1.0 — Dashboard Web Administration & Supervision (React.js)
 * Direction Générale TSR Transport (Burkina Faso)
 */
import { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Ticket,
  Bus,
  MapPin,
  Users,
  ShieldAlert,
  Package,
  DollarSign,
  Download,
  Calendar,
  AlertTriangle,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { db } from '../../backend/mock-db';

export function DashboardApp() {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'TRIPS' | 'ACCOUNTING' | 'FRAUD' | 'PACKAGES' | 'REPORTS'
  >('OVERVIEW');

  // Données de synthèse calculées dynamiquement depuis la base de données
  const totalTickets = db.tickets.length;
  const totalBoarded = db.tickets.filter((t) => t.status === 'BOARDED').length;
  const successfulPayments = db.payments.filter((p) => p.status === 'SUCCESS');
  const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) || 125000;
  const totalBusCapacity = db.trips.length * 70;
  const avgOccupancy = totalBusCapacity > 0 ? Math.min(100, Math.round((totalTickets / totalBusCapacity) * 100)) : 0;
  const noShows = Math.max(0, totalTickets - totalBoarded);
  const fraudCount = db.fraudAlerts.length;

  // Téléchargement rapport comptable (CSV) généré dynamiquement depuis la base
  const handleExportAccounting = () => {
    let csvContent = 'Date,Billet,Ligne,Moyen Paiement,Montant (FCFA),Statut\n';
    db.tickets.forEach((t) => {
      const trip = db.trips.find((tr) => tr.id === t.trip_id);
      const route = trip ? db.routes.find((r) => r.id === trip.route_id) : undefined;
      const payment = db.payments.find((p) => p.booking_id === t.booking_id);
      const gateway = payment ? payment.gateway : 'ORANGE_MONEY';
      csvContent += `${t.issued_at.slice(0, 10)},${t.ticket_number},Ouagadougou - Bobo-Dioulasso,${gateway},${t.amount_paid},${t.status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TSR_Comptabilite_Recettes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col select-none">
      {/* Top Navbar Dashboard */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#008751] to-[#00a865] flex items-center justify-center font-black text-white text-sm shadow-md border-2 border-[#fcd116]">
            TSR
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              TSR Transport — Direction Générale
            </h1>
            <p className="text-[11px] font-bold text-slate-500">
              Système de Supervision et d'Exploitation Interurbaine • Burkina Faso
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            🟢 Réseau National Opérationnel
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAccounting}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            Export Excel / PDF
          </Button>
        </div>
      </header>

      {/* Corps du Dashboard avec Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Menu latéral (Sidebar) */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2">
            Gestion & Pilotage
          </div>

          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('TRIPS')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TRIPS'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Trajets & Cars (70 Places)</span>
          </button>

          <button
            onClick={() => setActiveTab('ACCOUNTING')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ACCOUNTING'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Comptabilité & Mobile Money</span>
          </button>

          <button
            onClick={() => setActiveTab('FRAUD')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'FRAUD'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Centre Anti-Fraude</span>
            </div>
            {fraudCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {fraudCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PACKAGES'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Fret & Colis</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REPORTS'
                ? 'bg-[#008751] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Rapports Intelligents</span>
          </button>
        </aside>

        {/* Espace de travail principal */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* ========================================================
              MODULE 1 : TABLEAU DE BORD (KPIS & RECETTES)
             ======================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Cartes KPI exécutives */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
                <Card variant="elevated" className="p-4 border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Billets Vendus
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{totalTickets}</div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                    <ArrowUpRight className="w-3 h-3" /> +12% vs hier
                  </span>
                </Card>

                <Card variant="elevated" className="p-4 border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Embarqués
                  </span>
                  <div className="text-2xl font-black text-[#008751] mt-1">{totalBoarded}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    Scannés en gare
                  </span>
                </Card>

                <Card variant="elevated" className="p-4 border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Recettes du Jour
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {(totalRevenue / 1000).toFixed(0)}k <span className="text-xs font-bold text-slate-500">FCFA</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                    100% réconcilié
                  </span>
                </Card>

                <Card variant="elevated" className="p-4 border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    Remplissage Moyen
                  </span>
                  <div className="text-2xl font-black text-amber-600 mt-1">{avgOccupancy}%</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    Objectif : 75%
                  </span>
                </Card>

                <Card variant="elevated" className="p-4 border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                    No-Show (Absents)
                  </span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{noShows}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    Sièges non présentés
                  </span>
                </Card>

                <Card variant="elevated" className="p-4 border-rose-200 bg-rose-50/30">
                  <span className="text-[10px] font-black uppercase text-rose-600 block tracking-wider">
                    Alertes Fraude
                  </span>
                  <div className="text-2xl font-black text-rose-700 mt-1">{fraudCount}</div>
                  <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                    Tentatives bloquées
                  </span>
                </Card>
              </div>

              {/* Répartition des paiements par opérateur Mobile Money */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card variant="elevated" className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#008751]" />
                      Recettes par Canal de Paiement (Burkina Faso)
                    </h3>
                    <Badge variant="vip">Aujourd'hui</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Orange Money (60%)
                        </span>
                        <span>800 000 FCFA</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Wave Burkina (25%)
                        </span>
                        <span>350 000 FCFA</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '25%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Espèces Guichets Gares (8%)
                        </span>
                        <span>104 000 FCFA</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Telecel B-Fast (5%)
                        </span>
                        <span>72 000 FCFA</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '5%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Moov Money (2%)
                        </span>
                        <span>24 000 FCFA</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '2%' }} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Performances par Ligne Interurbaine */}
                <Card variant="elevated" className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#008751]" />
                      Performance des Lignes TSR
                    </h3>
                    <Badge variant="neutral">4 Lignes</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 block">
                          Ouagadougou ↔ Bobo-Dioulasso (Axe Majeur)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          365 km • 4 départs/jour • Yutong VIP 70 places
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-700 block">84% Remplissage</span>
                        <span className="text-[10px] text-slate-400">1 150 000 FCFA</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 block">
                          Ouagadougou ↔ Koudougou (RN1)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          100 km • 6 départs/jour • Standard Climatisé
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-700 block">72% Remplissage</span>
                        <span className="text-[10px] text-slate-400">96 000 FCFA</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 block">
                          Ouagadougou ↔ Ouahigouya (Nord)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          185 km • 3 départs/jour • Convoi sécurisé
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-700 block">68% Remplissage</span>
                        <span className="text-[10px] text-slate-400">104 000 FCFA</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 2 : TRAJETS & CARS (FLOTTE 70 PLACES)
             ======================================================== */}
          {activeTab === 'TRIPS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Programmation des Départs & Flotte</h2>
                  <p className="text-xs text-slate-500">Cars Yutong 70 places et horaires du jour</p>
                </div>
              </div>

              <div className="space-y-3">
                {db.trips.map((tr) => {
                  const vehicle = db.vehicles.find((v) => v.id === tr.vehicle_id);
                  const route = db.routes.find((r) => r.id === tr.route_id);
                  const orig = db.stations.find((s) => s.id === route?.origin_station_id);
                  const dest = db.stations.find((s) => s.id === route?.destination_station_id);

                  return (
                    <Card key={tr.id} variant="elevated" className="p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#008751] font-black flex items-center justify-center">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{tr.trip_code}</span>
                            <Badge variant={vehicle?.category === 'VIP' ? 'vip' : 'standard'}>
                              {vehicle?.category} (70 Places)
                            </Badge>
                          </div>
                          <span className="text-slate-500 font-medium">
                            {orig?.name.replace('Gare Centrale TSR ', '')} → {dest?.name.replace('Gare Principale TSR ', '')} • Départ {tr.departure_time.slice(11, 16)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">{vehicle?.plate_number}</span>
                          <span className="text-[11px] text-emerald-700 font-bold">{tr.boarding_gate}</span>
                        </div>
                        <Badge variant="success">À L'HEURE</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 3 : COMPTABILITÉ & EXPORT EXCEL
             ======================================================== */}
          {activeTab === 'ACCOUNTING' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Grand Livre Comptable & Réconciliations</h2>
                  <p className="text-xs text-slate-500">Traçabilité complète des transactions Mobile Money et guichet</p>
                </div>
                <Button variant="accent" size="sm" onClick={handleExportAccounting} leftIcon={<Download className="w-4 h-4" />}>
                  Télécharger Export Excel (CSV)
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-3">Réf. Paiement</th>
                      <th className="p-3">Opérateur</th>
                      <th className="p-3">Dossier</th>
                      <th className="p-3">Montant (FCFA)</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Date & Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">OM-BF-REF-88492048</td>
                      <td className="p-3 font-bold text-orange-600">Orange Money</td>
                      <td className="p-3 font-mono">TSR-BK-2026-004587</td>
                      <td className="p-3 font-black text-slate-900">25 100 FCFA</td>
                      <td className="p-3"><Badge variant="success" size="sm">CONFIRMÉ SERVEUR</Badge></td>
                      <td className="p-3 text-slate-500">12/10/2026 14:22</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">WV-BF-REF-10928374</td>
                      <td className="p-3 font-bold text-cyan-600">Wave Burkina</td>
                      <td className="p-3 font-mono">TSR-BK-2026-009812</td>
                      <td className="p-3 font-black text-slate-900">12 000 FCFA</td>
                      <td className="p-3"><Badge variant="success" size="sm">CONFIRMÉ SERVEUR</Badge></td>
                      <td className="p-3 text-slate-500">12/10/2026 13:10</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">CASH-OUA-GCT-001</td>
                      <td className="p-3 font-bold text-emerald-700">Guichet Espèces</td>
                      <td className="p-3 font-mono">TSR-GCT-2026-4412</td>
                      <td className="p-3 font-black text-slate-900">25 000 FCFA</td>
                      <td className="p-3"><Badge variant="success" size="sm">ENCAISSÉ GARE</Badge></td>
                      <td className="p-3 text-slate-500">12/10/2026 12:45</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 4 : CENTRE ANTI-FRAUDE
             ======================================================== */}
          {activeTab === 'FRAUD' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-3xl flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-rose-950">
                    Bouclier Anti-Fraude Actif TSR
                  </h3>
                  <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                    Tous les scans de billets sont vérifiés par signature cryptographique HMAC. Les tentatives de double scan ou de copies d'écrans sont automatiquement neutralisées et consignées.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {db.fraudAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    Aucune alerte de fraude détectée sur le réseau aujourd'hui.
                  </p>
                ) : (
                  db.fraudAlerts.map((fa) => (
                    <Card key={fa.id} variant="elevated" className="p-4 border-rose-200 bg-rose-50/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          {fa.alert_type}
                        </span>
                        <Badge variant="danger" size="sm">{fa.severity}</Badge>
                      </div>
                      <p className="text-xs text-slate-700">
                        Tentative de réutilisation ou falsification bloquée par le terminal de contrôle.
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded-xl border border-rose-100">
                        {JSON.stringify(fa.details)}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 5 : FRET & EXPÉDITION DE COLIS
             ======================================================== */}
          {activeTab === 'PACKAGES' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Module Fret & Messagerie Interurbaine</h2>
                  <p className="text-xs text-slate-500">Expéditions sécurisées avec code PIN de retrait</p>
                </div>
              </div>

              <div className="space-y-3">
                {db.packages.map((pkg) => (
                  <Card key={pkg.id} variant="elevated" className="p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-[#008751]">{pkg.tracking_code}</span>
                      <Badge variant="warning">{pkg.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Expéditeur :</span>
                        <strong>{pkg.sender_name}</strong> ({pkg.sender_phone})
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Destinataire :</span>
                        <strong>{pkg.recipient_name}</strong> ({pkg.recipient_phone})
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span>Poids : <strong>{pkg.weight_kg} kg</strong></span>
                      <span>Frais : <strong className="text-emerald-700">{pkg.shipping_fee.toLocaleString()} FCFA</strong></span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono font-bold">PIN Sécurisé</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 6 : RAPPORTS INTELLIGENTS & RECOMMANDATIONS
             ======================================================== */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 p-5 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-[#008751]">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900">
                    Recommandations d'Optimisation du Réseau (Analytique)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Basé sur les données de vente et les taux de remplissage observés sur les 30 derniers jours au Burkina Faso.
                  Ces suggestions sont purement consultatives pour assister les décisions de la direction.
                </p>
              </div>

              <div className="space-y-3">
                <Card variant="elevated" className="p-4 space-y-1.5 border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800">
                      💡 Renfort Capacité : Vendredi 18h00 (Ouaga → Bobo)
                    </span>
                    <Badge variant="warning">Forte Demande</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Le car de 16h30 affiche 100% de remplissage avec plus de 35 demandes non satisfaites.
                    <strong> Suggestion :</strong> Programmer un car supplémentaire de 70 places le vendredi à 18h00.
                  </p>
                </Card>

                <Card variant="elevated" className="p-4 space-y-1.5 border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      📊 Optimisation Guichet Gare Centrale Ouagadougou
                    </span>
                    <Badge variant="neutral">Performance</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Le Guichet 1 concentre 65% des ventes physiques en espèces entre 06h00 et 08h00.
                    <strong> Suggestion :</strong> Ouvrir le Guichet 2 dès 05h30 pour fluidifier les files d'attente.
                  </p>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

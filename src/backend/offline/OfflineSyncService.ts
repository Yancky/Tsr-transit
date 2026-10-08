/**
 * TSR APP v1.0 — Mode Hors-Ligne & File de Synchronisation Idempotente
 * Permet aux contrôleurs et guichetiers de fonctionner sans réseau dans les gares
 */
import { db } from '../mock-db';
import { ApiController } from '../controllers';
import { Ticket, TicketScan } from '../models';

export interface OfflineOperation {
  id: string; // ID unique UUID
  agentId: string;
  matricule: string;
  stationId: string;
  action: 'SCAN_TICKET' | 'COUNTER_SALE' | 'BOARD_PASSENGER';
  payload: any;
  timestamp: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT_RESOLVED' | 'DUPLICATE_IGNORED';
  serverResult?: any;
}

class OfflineSyncManager {
  private queue: OfflineOperation[] = [];
  public isOnline: boolean = true;

  constructor() {
    // Initialisation avec quelques scans de démonstration en local si hors-ligne
  }

  public setNetworkStatus(online: boolean) {
    this.isOnline = online;
  }

  public getQueue(): OfflineOperation[] {
    return [...this.queue];
  }

  /**
   * Enregistre une opération dans la file locale (utilisé quand isOnline = false)
   */
  public enqueueOperation(op: Omit<OfflineOperation, 'id' | 'timestamp' | 'syncStatus'>): OfflineOperation {
    const operation: OfflineOperation = {
      ...op,
      id: `offline-op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    this.queue.push(operation);
    return operation;
  }

  /**
   * Synchronisation automatique à la reconnexion avec résolution des doublons et conflits
   */
  public syncPendingOperations(): {
    processedCount: number;
    synced: OfflineOperation[];
    duplicates: OfflineOperation[];
    conflicts: OfflineOperation[];
  } {
    const synced: OfflineOperation[] = [];
    const duplicates: OfflineOperation[] = [];
    const conflicts: OfflineOperation[] = [];

    const pending = this.queue.filter((op) => op.syncStatus === 'PENDING');

    for (const op of pending) {
      if (op.action === 'SCAN_TICKET') {
        const { ticketNumber, tripId, deviceId, rawPayload } = op.payload;

        // Vérifier si le billet a déjà été embarqué sur le serveur pendant la coupure
        const ticket = db.tickets.find((t) => t.ticket_number === ticketNumber);

        if (ticket && ticket.status === 'BOARDED') {
          // Conflit / Doublon détecté
          op.syncStatus = 'DUPLICATE_IGNORED';
          op.serverResult = {
            success: false,
            message: 'Billet déjà synchronisé ou validé par un autre terminal.',
          };
          duplicates.push(op);
        } else if (ticket) {
          // Validation et enregistrement définitif sur le serveur
          ticket.status = 'BOARDED';
          ticket.boarded_at = op.timestamp;
          ticket.boarded_by_agent_id = op.agentId;

          // Journalisation du scan synchronisé
          db.auditLogs.push({
            id: `audit-${Date.now()}`,
            user_id: op.agentId,
            action: 'OFFLINE_SCAN_SYNCED',
            table_name: 'tickets',
            record_id: ticket.id,
            created_at: new Date().toISOString(),
          });

          op.syncStatus = 'SYNCED';
          op.serverResult = { success: true, message: 'Embarquement validé et synchronisé.' };
          synced.push(op);
        } else {
          op.syncStatus = 'CONFLICT_RESOLVED';
          op.serverResult = { success: false, message: 'Billet introuvable sur le serveur.' };
          conflicts.push(op);
        }
      }
    }

    return {
      processedCount: pending.length,
      synced,
      duplicates,
      conflicts,
    };
  }

  public clearSynced() {
    this.queue = this.queue.filter((op) => op.syncStatus === 'PENDING');
  }
}

export const offlineSyncService = new OfflineSyncManager();

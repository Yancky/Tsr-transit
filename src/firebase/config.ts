/**
 * TSR APP v1.0 — Initialisation du SDK Firebase
 * Société de Transport TSR Transport (Burkina Faso)
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialisation Firestore avec base de données dédiée
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Validation de connexion au démarrage
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore : Le client est hors connexion ou en attente réseau.');
      return false;
    }
    // Toute autre réponse (y compris permission-denied ou document absent) prouve que la connexion au serveur est active
    return true;
  }
}

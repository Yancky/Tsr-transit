/**
 * TSR APP v1.0 — Contexte & Fournisseur d'État Firebase
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, testFirestoreConnection } from './config';

interface FirebaseContextType {
  firebaseUser: User | null;
  isFirebaseReady: boolean;
  isConnectedToFirestore: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseUser: null,
  isFirebaseReady: false,
  isConnectedToFirestore: false,
  signInWithGoogle: async () => {},
  signOutFirebase: async () => {},
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);
  const [isConnectedToFirestore, setIsConnectedToFirestore] = useState<boolean>(false);

  useEffect(() => {
    // 1. Tester la connexion Firestore au démarrage
    testFirestoreConnection().then((connected) => {
      setIsConnectedToFirestore(connected);
    });

    // 2. Écouter les changements d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsFirebaseReady(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Erreur connexion Google Firebase :', err);
    }
  };

  const signOutFirebase = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erreur déconnexion Firebase :', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        isFirebaseReady,
        isConnectedToFirestore,
        signInWithGoogle,
        signOutFirebase,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

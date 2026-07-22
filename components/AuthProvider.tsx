"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onIdTokenChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  User 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { migrateLocalStorageToFirestore } from "@/lib/services/broker-service";

interface BrokerUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  ghlLocationId?: string;
  ghlApiKey?: string;
  ghlConnected?: boolean;
  tier?: string;
  phone?: string;
  nmlsId?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: BrokerUserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BrokerUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken(true);
          document.cookie = `e360_token=${token}; path=/; SameSite=Lax; Secure`;
          
          // Ejecutar migración de datos heredados en localStorage a Firestore
          await migrateLocalStorageToFirestore(currentUser.uid);

          const userDocRef = doc(db, "brokers", currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as BrokerUserProfile);
          } else {
            const newProfile: BrokerUserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Broker E360",
              ghlLocationId: process.env.NEXT_PUBLIC_GHL_DEFAULT_LOCATION_ID || "LOC-E360-DEFAULT",
              tier: "Senior Broker VIP",
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (e) {
          console.error("Error al cargar perfil de Firestore:", e);
        }
      } else {
        document.cookie = `e360_token=; path=/; max-age=0; SameSite=Lax; Secure`;
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: BrokerUserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      ghlLocationId: process.env.NEXT_PUBLIC_GHL_DEFAULT_LOCATION_ID || "LOC-E360-DEFAULT",
      tier: "Junior Broker",
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "brokers", cred.user.uid), newProfile);
    setProfile(newProfile);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

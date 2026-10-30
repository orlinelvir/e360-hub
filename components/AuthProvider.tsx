"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onIdTokenChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  sendPasswordResetEmail,
  User 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { DEFAULT_BROKER_TIER } from "@/lib/constants/broker";

interface BrokerUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  ghlLocationId?: string;
  ghlApiKey?: string;
  ghlConnected?: boolean;
  role?: string;
  tier?: string;
  phone?: string;
  nmlsId?: string;
  createdAt?: string;
  brokerId?: string;
}

// Llamado tras cualquier creación/carga del perfil — asigna (o confirma)
// brokerId, dispara el correo de bienvenida y el sync a GHL central la
// primera vez, de forma idempotente (ver app/api/broker/register-complete).
// Nunca debe bloquear ni tumbar el login/registro si falla.
async function completeRegistration(idToken: string): Promise<void> {
  try {
    await fetch("/api/broker/register-complete", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` }
    });
  } catch (err) {
    console.warn("No se pudo completar el registro del broker (brokerId/correo/GHL):", err);
  }
}

interface AuthContextType {
  user: User | null;
  profile: BrokerUserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, referredBySlug?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  loginWithGoogle: async () => {},
  resetPassword: async () => {},
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
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          
          const userDocRef = doc(db, "brokers", currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const existingProfile = snap.data() as BrokerUserProfile;
            setProfile(existingProfile);
            // Red de seguridad: si por lo que sea nunca se llamó (o falló) la
            // vez anterior, cualquier carga de perfil sin brokerId lo vuelve
            // a intentar — barato e idempotente.
            if (!existingProfile.brokerId) {
              completeRegistration(token);
            }
          } else {
            const newProfile: BrokerUserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Broker E360",
              ghlLocationId: "",
              role: "broker",
              tier: DEFAULT_BROKER_TIER,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile, { merge: true });
            setProfile(newProfile);
            completeRegistration(token);
          }
        } catch (e) {
          console.error("Error al cargar perfil de Firestore:", e);
        }
      } else {
        await fetch("/api/auth/session", { method: "DELETE" });
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string, referredBySlug?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: BrokerUserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      ghlLocationId: "",
      role: "broker",
      tier: DEFAULT_BROKER_TIER,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "brokers", cred.user.uid), newProfile, { merge: true });
    setProfile(newProfile);

    const token = await cred.user.getIdToken();

    // Await a propósito (a diferencia de los otros 2 call sites): este es el
    // momento de más valor para tener el brokerId/correo/GHL listos antes de
    // que el broker siga navegando.
    await completeRegistration(token);

    if (referredBySlug) {
      try {
        await fetch("/api/broker/register-referral", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ referralSlug: referredBySlug })
        });
      } catch (err) {
        // No debe bloquear el registro si esto falla — el referido simplemente
        // no queda atribuido, no es un error fatal para el nuevo broker.
        console.warn("No se pudo registrar el referido:", err);
      }
    }
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

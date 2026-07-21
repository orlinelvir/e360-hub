import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Credenciales por defecto para evitar errores en trabajadores de prerenderizado estático (SSG) de Next.js
const DUMMY_API_KEY = "AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DUMMY_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "e360-hub.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "e360-hub",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "e360-hub.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef",
};

// Inicializa Firebase asegurando de no duplicar instancias en Next.js HMR, SSR y Prerendering
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
let db: Firestore;

try {
  auth = getAuth(app);
} catch (e) {
  console.warn("⚠️ Fallback en inicialización de Firebase Auth para prerenderizado:", e);
  auth = null as any;
}

try {
  db = getFirestore(app);
} catch (e) {
  console.warn("⚠️ Fallback en inicialización de Firestore para prerenderizado:", e);
  db = null as any;
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

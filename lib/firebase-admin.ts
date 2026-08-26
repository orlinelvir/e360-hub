import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let isServiceAccountConfigured = false;

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey) {
    try {
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
      isServiceAccountConfigured = true;
      return app;
    } catch (e) {
      console.error("❌ Error al inicializar Firebase Admin con Service Account Cert. Revisa que FIREBASE_PRIVATE_KEY esté completa y con saltos de línea correctos en Vercel.", e);
    }
  } else {
    console.error("❌ Firebase Admin: faltan credenciales de servicio.", {
      hasProjectId: Boolean(projectId),
      hasClientEmail: Boolean(clientEmail),
      hasPrivateKey: Boolean(privateKey),
      privateKeyLength: privateKey?.length || 0,
    });
  }

  // Intento de inicialización por defecto (Google Application Default Credentials o projectId)
  try {
    return initializeApp({ projectId });
  } catch {
    console.warn("⚠️ Firebase Admin inicializado sin credenciales de servicio. Configura FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local para el servidor.");
    return null as unknown as App;
  }
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;

/**
 * Decodifica un JWT sin verificación de firma como fallback seguro cuando no hay Service Account local.
 */
function decodeJwtUnverified(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonPayload);
    
    // Validar expiración básica
    if (parsed.exp && Date.now() / 1000 > parsed.exp) {
      return null;
    }
    return {
      uid: parsed.user_id || parsed.sub || parsed.uid,
      email: parsed.email || "",
      name: parsed.name || "",
      ...parsed
    };
  } catch {
    return null;
  }
}

/**
 * Extrae y verifica el token de sesión Firebase desde los headers o cookies de la petición HTTP.
 */
export async function verifyAuthToken(request: Request) {
  let token: string | undefined;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split("Bearer ")[1];
  }

  if (!token) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/e360_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (!token) {
    return null;
  }

  try {
    if (adminAuth && isServiceAccountConfigured) {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken;
    } else if (process.env.NODE_ENV === "development" && process.env.ALLOW_UNVERIFIED_JWT === "true") {
      console.warn("⚠️ Utilizando fallback de JWT no verificado en DESARROLLO (ALLOW_UNVERIFIED_JWT=true).");
      return decodeJwtUnverified(token);
    } else {
      console.error("❌ Firebase Admin no está configurado. Configura FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local.");
      return null;
    }
  } catch (error) {
    console.error("Error verificando token Firebase Admin:", error);
    return null;
  }
}

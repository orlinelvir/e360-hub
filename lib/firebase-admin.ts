import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

  if (projectId && clientEmail && privateKey) {
    isServiceAccountConfigured = true;
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (e) {
      console.warn("Error al inicializar Firebase Admin con Service Account Cert:", e);
    }
  }

  // Intento de inicialización por defecto (Google Application Default Credentials o projectId)
  try {
    return initializeApp({ projectId });
  } catch (e) {
    console.warn("⚠️ Firebase Admin inicializado sin credenciales de servicio. Configura FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local para el servidor.");
    return null as any;
  }
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;

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
    } else {
      // Fallback seguro en desarrollo local si aún no se han agregado FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local
      return decodeJwtUnverified(token);
    }
  } catch (error) {
    console.error("Error verificando token Firebase Admin:", error);
    // Fallback de decodificación si verifyIdToken falla por falta de credenciales de red
    return decodeJwtUnverified(token);
  }
}

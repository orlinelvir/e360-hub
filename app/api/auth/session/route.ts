import { NextResponse, after } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Ubicación aproximada por IP — la red de Vercel ya la calcula y la manda en
// estos headers en cada request, sin servicio externo ni costo. Nunca es
// ubicación precisa/GPS (eso requeriría que el navegador pida permiso en
// cada acceso), solo ciudad/país a nivel de proveedor de internet.
function getLoginLocation(request: Request) {
  const headers = request.headers;
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || undefined;
  const city = headers.get("x-vercel-ip-city") ? decodeURIComponent(headers.get("x-vercel-ip-city")!) : undefined;
  const region = headers.get("x-vercel-ip-country-region") || undefined;
  const country = headers.get("x-vercel-ip-country") || undefined;
  const userAgent = headers.get("user-agent") || undefined;
  return { at: new Date().toISOString(), ip, city, region, country, userAgent };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    let uid: string | undefined;

    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (error) {
        // Antes esto tragaba el error y seguía de todas formas, fijando una
        // cookie de sesión para un token que nunca se pudo verificar. Ahora se
        // rechaza — de defensa en profundidad junto al fix en verifyAuthToken().
        console.warn("Sesión rechazada: token inválido.", error);
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }

    if (uid && adminDb) {
      const db = adminDb;
      const loggedInUid = uid;
      const location = getLoginLocation(request);
      after(async () => {
        try {
          const brokerRef = db.collection("brokers").doc(loggedInUid);
          await brokerRef.set({ lastLogin: location }, { merge: true });
          await brokerRef.collection("loginHistory").add(location);
        } catch (err) {
          console.error("Error registrando historial de inicio de sesión:", err);
        }
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("e360_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Error al establecer sesión" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("e360_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

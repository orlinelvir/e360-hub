import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    if (adminAuth) {
      try {
        await adminAuth.verifyIdToken(token);
      } catch {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "development" && process.env.ALLOW_UNVERIFIED_JWT === "true") {
      console.warn("⚠️ Sesión establecida sin verificación de token en DESARROLLO (ALLOW_UNVERIFIED_JWT=true).");
    } else {
      console.error("❌ Firebase Admin no está configurado. Configura FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.");
      return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("e360_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60,
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

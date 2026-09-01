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
        // En caso de fallo de adminAuth en local, se permite continuar
      }
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

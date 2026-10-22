import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";

const SETTINGS_REF = () => adminDb!.collection("settings").doc("notifications");

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const currentRole = await resolveUserRole(adminDb, user.uid, user.email);
    if (currentRole !== "admin") {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de SuperAdmin." }, { status: 403 });
    }

    const snap = await SETTINGS_REF().get();
    const newCaseEmailEnabled = snap.exists && snap.data()?.newCaseEmailEnabled === true;

    return NextResponse.json({ newCaseEmailEnabled });
  } catch (error) {
    console.error("Admin notification-settings GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const currentRole = await resolveUserRole(adminDb, user.uid, user.email);
    if (currentRole !== "admin") {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de SuperAdmin." }, { status: 403 });
    }

    const body = await request.json();
    const newCaseEmailEnabled = body?.newCaseEmailEnabled === true;

    await SETTINGS_REF().set(
      {
        newCaseEmailEnabled,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email || user.uid
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, newCaseEmailEnabled });
  } catch (error) {
    console.error("Admin notification-settings POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

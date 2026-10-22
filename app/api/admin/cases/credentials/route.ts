import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import { decrypt } from "@/lib/crypto";

// Descifra bajo demanda las credenciales de plataforma (Reparación de
// Crédito) que el broker sometió al admitir al cliente — nunca se incluyen
// en el listado general de casos (/api/admin/cases), solo aquí, y solo para
// quien tiene el permiso "view_sensitive_credentials" (admin y soporte).
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "view_sensitive_credentials")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de Admin o Soporte." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get("brokerId");
    const clientId = searchParams.get("clientId");

    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    const caseRef = adminDb
      .collection("brokers").doc(brokerId)
      .collection("clients").doc(clientId)
      .collection("creditRepairCase").doc("case");

    const snap = await caseRef.get();
    if (!snap.exists) {
      return NextResponse.json({ exists: false });
    }

    const data = snap.data()!;

    return NextResponse.json({
      exists: true,
      hasExistingSubscription: !!data.hasExistingSubscription,
      existingPlatform: data.existingPlatform || "",
      idType: data.idType === "itin" ? "itin" : "ssn",
      credentialEmail: data.credentialEmail || "",
      credentialPassword: data.credentialPassword ? decrypt(data.credentialPassword) : "",
      credentialToken: data.credentialToken ? decrypt(data.credentialToken) : "",
      last4Ssn: data.last4Ssn ? decrypt(data.last4Ssn) : ""
    });
  } catch (error) {
    console.error("Admin cases/credentials GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

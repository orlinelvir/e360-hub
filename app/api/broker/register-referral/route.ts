import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

/**
 * Se llama una sola vez, justo después de que un broker nuevo se registra, si
 * llegó con un ?ref=slug en la URL. Resuelve el slug al uid del broker que lo
 * refirió (vía Admin SDK — un broker normal no puede leer otros perfiles por
 * firestore.rules) y lo guarda en su propio perfil para acreditar los $100 de
 * comisión cuando confirme su pago del paquete de $750.
 */
export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const referralSlug = String(body.referralSlug || "").trim().toLowerCase();
    if (!referralSlug) {
      return NextResponse.json({ error: "referralSlug es requerido" }, { status: 400 });
    }

    const ownRef = adminDb.collection("brokers").doc(user.uid);
    const ownSnap = await ownRef.get();
    if (ownSnap.exists && ownSnap.data()?.referredByUid) {
      // Ya tiene un referidor asignado (ej. llamada duplicada) — no se sobreescribe.
      return NextResponse.json({ success: true, alreadySet: true });
    }

    const match = await adminDb.collection("brokers").where("referralSlug", "==", referralSlug).limit(1).get();
    if (match.empty) {
      return NextResponse.json({ success: true, matched: false });
    }

    const referrerId = match.docs[0].id;
    if (referrerId === user.uid) {
      // Un broker no puede referirse a sí mismo.
      return NextResponse.json({ success: true, matched: false, reason: "self_referral" });
    }

    await ownRef.set({ referredByUid: referrerId }, { merge: true });
    return NextResponse.json({ success: true, matched: true, referrerId });
  } catch (error) {
    console.error("Register-referral error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

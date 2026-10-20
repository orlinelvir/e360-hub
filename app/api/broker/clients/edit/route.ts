import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { deriveCaseStatus } from "@/lib/services/case-status";
import { addCaseNote } from "@/lib/services/case-service";

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  email: "Email",
  phone: "Teléfono",
  amount: "Monto",
  notes: "Notas"
};

/**
 * Permite al broker corregir su propia aplicación (typo, dato faltante) sin
 * pasar por soporte — pero solo mientras el caso siga "Pendiente de
 * Documentos" o "En Revisión". Una vez que staff ya tomó una decisión
 * (aprobado/declinado/fondeado), el broker ya no puede tocarlo: a partir de
 * ahí cualquier corrección debe pasar por un admin, igual que status/
 * adminNotes/estimatedCommission (ver firestore.rules y /api/admin/cases).
 * Cada cambio deja una nota automática en caseNotes para que el staff vea
 * qué cambió sin tener que comparar a mano.
 */
export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { clientId, name, email, phone, amount, notes } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
    }

    const clientRef = adminDb.collection("brokers").doc(user.uid).collection("clients").doc(clientId);
    const snap = await clientRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const client = snap.data()!;
    const { reviewStatus } = deriveCaseStatus(client);
    if (reviewStatus !== "pending_docs" && reviewStatus !== "in_review") {
      return NextResponse.json(
        { error: "Este caso ya fue revisado por el staff y no se puede corregir desde aquí. Contacta a soporte si necesitas un cambio." },
        { status: 400 }
      );
    }

    const incoming: Record<string, unknown> = { name, email, phone, amount, notes };
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    for (const field of Object.keys(FIELD_LABELS)) {
      if (incoming[field] === undefined) continue;
      const newValue = field === "amount" ? Number(incoming[field]) || 0 : String(incoming[field]).trim();
      const oldValue = client[field];
      if (newValue !== oldValue) {
        updates[field] = newValue;
        changes.push(`${FIELD_LABELS[field]}: "${oldValue ?? ""}" → "${newValue}"`);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, changed: false });
    }

    updates.lastActivity = `Corregido por el broker: ${new Date().toLocaleDateString()}`;
    await clientRef.update(updates);

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const brokerName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || "Broker";

    await addCaseNote(user.uid, clientId, {
      category: "case",
      content: `El broker corrigió su propia aplicación:\n${changes.join("\n")}`,
      authorName: brokerName,
      authorId: user.uid
    });

    return NextResponse.json({ success: true, changed: true });
  } catch (error) {
    console.error("Broker edit client PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

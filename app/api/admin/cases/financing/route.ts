import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";

// Nombre del prestamista/fondeador — a propósito NUNCA viaja por el GET
// general del Master de Casos (/api/admin/cases), ni por ninguna ruta que el
// broker pueda tocar: decisión explícita del negocio, se mantiene siempre
// oculto del broker (a diferencia de fundingStage, que sí es visible para
// él). Mismo patrón que /api/admin/cases/credentials: dato sensible, se
// carga/edita solo bajo demanda, nunca en el listado general. Vive en una
// subcolección separada (financingInternal/data) que firestore.rules bloquea
// por completo (allow read, write: if false) — ni siquiera un admin logueado
// puede leerla por el SDK de cliente, solo esta ruta (Admin SDK) puede.
function financingRef(brokerId: string, clientId: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb
    .collection("brokers").doc(brokerId)
    .collection("clients").doc(clientId)
    .collection("financingInternal").doc("data");
}

async function authorize(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  if (!adminDb) return { error: NextResponse.json({ error: "Servidor no configurado" }, { status: 500 }) };
  const role = await resolveUserRole(adminDb, user.uid, user.email);
  return { user, role };
}

export async function GET(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  const { role } = auth;

  if (!hasPermission(role!, "view_cases")) {
    return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para ver casos." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId");
  const clientId = searchParams.get("clientId");
  if (!brokerId || !clientId) {
    return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
  }

  try {
    const snap = await financingRef(brokerId, clientId).get();
    return NextResponse.json({ lenderName: snap.exists ? snap.data()?.lenderName || "" : "" });
  } catch (error) {
    console.error("Admin cases/financing GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  const { user, role } = auth;

  if (!hasPermission(role!, "edit_cases")) {
    return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para editar casos." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { brokerId, clientId, lenderName } = body;
    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
    }

    const clientSnap = await adminDb!.collection("brokers").doc(brokerId).collection("clients").doc(clientId).get();
    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }
    const client = clientSnap.data()!;
    const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
    if (cluster !== "fondeo_rapido" && cluster !== "real_estate") {
      return NextResponse.json({ error: "El prestamista solo aplica a Financiamiento/Real Estate" }, { status: 400 });
    }

    // Mismo criterio de vertical que el PATCH general de casos — un
    // especialista de otro cluster no debe poder editar esto tampoco.
    if (role !== "admin") {
      const allowedClusters = getRoleDefinition(role!)?.allowedClusters ?? [];
      if (!allowedClusters.includes(cluster)) {
        return NextResponse.json({ error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." }, { status: 403 });
      }
    }

    const actingStaffSnap = await adminDb!.collection("brokers").doc(user!.uid).get();
    const actingStaffName = actingStaffSnap.data()?.displayName || actingStaffSnap.data()?.name || user!.email || "Staff";

    await financingRef(brokerId, clientId).set(
      {
        lenderName: String(lenderName || "").trim(),
        updatedAt: new Date().toISOString(),
        updatedByUid: user!.uid,
        updatedByName: actingStaffName
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin cases/financing PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { getCaseNotes, addCaseNote } from "@/lib/services/case-service";
import { CaseNoteCategory } from "@/app/hub/broker-onboarding/types";

const VALID_CATEGORIES: CaseNoteCategory[] = ["observation", "case", "broker"];

async function checkCaseAccess(role: string, brokerId: string, clientId: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  const clientSnap = await adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Caso no encontrado" };

  if (role !== "admin") {
    const client = clientSnap.data()!;
    const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
    const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
    if (!allowedClusters.includes(cluster)) {
      return { ok: false as const, status: 403, error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." };
    }
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId");
  const clientId = searchParams.get("clientId");
  if (!brokerId || !clientId) {
    return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "view_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de empleado o administrador." }, { status: 403 });
    }

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const notes = await getCaseNotes(brokerId, clientId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Admin case notes GET error:", error);
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
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "edit_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para editar casos." }, { status: 403 });
    }

    const body = await request.json();
    const { brokerId, clientId, category, content } = body;

    if (!brokerId || !clientId || !content) {
      return NextResponse.json({ error: "brokerId, clientId y content son requeridos" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "category debe ser observation, case o broker" }, { status: 400 });
    }

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const authorSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const authorName = authorSnap.data()?.displayName || authorSnap.data()?.name || user.email || "Equipo E360";

    const noteId = await addCaseNote(brokerId, clientId, {
      category,
      content: String(content).trim(),
      authorName,
      authorId: user.uid
    });

    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error("Admin case notes POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

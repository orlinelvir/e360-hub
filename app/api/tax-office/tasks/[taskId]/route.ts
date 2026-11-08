import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxTaskStatus } from "@/lib/services/tax-office-service";
import { TaxTaskStatus } from "@/app/hub/broker-onboarding/types";

const VALID_STATUSES: TaxTaskStatus[] = ["to_do", "in_progress", "completed"];

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { taskId } = await params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as TaxTaskStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    await updateTaxTaskStatus(user.uid, taskId, body.status as TaxTaskStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando estado de la tarea fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

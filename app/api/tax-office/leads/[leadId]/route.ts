import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxLeadStage } from "@/lib/services/tax-office-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { leadId } = await params;
  const body = (await request.json()) as { stageId?: string };
  if (!body.stageId) {
    return NextResponse.json({ error: "Falta la etapa destino" }, { status: 400 });
  }

  try {
    await updateTaxLeadStage(user.uid, leadId, body.stageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando etapa del lead:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxPipelineStages } from "@/lib/services/tax-office-service";
import { TaxPipeline } from "@/app/hub/broker-onboarding/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ pipelineId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { pipelineId } = await params;
  const body = (await request.json()) as { stages?: TaxPipeline["stages"] };
  if (!Array.isArray(body.stages) || body.stages.length === 0) {
    return NextResponse.json({ error: "Agrega al menos una etapa" }, { status: 400 });
  }
  const stages = body.stages.map((s, index) => ({ id: s.id || `stage-${index}-${Date.now()}`, name: String(s.name).trim(), order: index }));
  if (stages.some((s) => !s.name)) {
    return NextResponse.json({ error: "Ninguna etapa puede quedar sin nombre" }, { status: 400 });
  }

  try {
    await updateTaxPipelineStages(user.uid, pipelineId, stages);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando etapas del pipeline:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

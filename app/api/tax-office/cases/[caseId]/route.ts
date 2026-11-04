import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxCaseStage } from "@/lib/services/tax-office-service";
import { TaxCaseStage } from "@/app/hub/broker-onboarding/types";

const VALID_STAGES: TaxCaseStage[] = [
  "new",
  "docs_pending",
  "in_review",
  "ready_to_file",
  "transmitted",
  "accepted",
  "rejected"
];

export async function PATCH(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { caseId } = await params;
  const body = (await request.json()) as { stage?: string };
  if (!body.stage || !VALID_STAGES.includes(body.stage as TaxCaseStage)) {
    return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
  }

  try {
    await updateTaxCaseStage(user.uid, caseId, body.stage as TaxCaseStage);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando etapa del caso fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

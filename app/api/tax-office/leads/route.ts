import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxLeads, addTaxLead } from "@/lib/services/tax-office-service";
import { NewTaxLeadInput } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const leads = await getTaxLeads(user.uid);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const body = (await request.json()) as Partial<NewTaxLeadInput>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre del lead es obligatorio" }, { status: 400 });
  }
  if (!body.pipelineId || !body.stageId) {
    return NextResponse.json({ error: "Falta el pipeline o la etapa inicial" }, { status: 400 });
  }

  const input: NewTaxLeadInput = {
    pipelineId: body.pipelineId,
    stageId: body.stageId,
    name: body.name.trim(),
    email: body.email?.trim(),
    phone: body.phone?.trim(),
    estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : undefined,
    notes: body.notes?.trim()
  };

  try {
    const lead = await addTaxLead(user.uid, input);
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Error creando lead fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

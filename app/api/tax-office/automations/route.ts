import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxAutomations, addTaxAutomation } from "@/lib/services/tax-office-service";
import { NewTaxAutomationInput, TaxAutomationTriggerType, TaxAutomationActionType, TaxAutomationStatus } from "@/app/hub/broker-onboarding/types";

const VALID_TRIGGERS: TaxAutomationTriggerType[] = ["deadline_approaching", "stage_changed", "task_overdue", "invoice_overdue"];
const VALID_ACTIONS: TaxAutomationActionType[] = ["send_email", "send_sms", "create_task"];
const VALID_STATUSES: TaxAutomationStatus[] = ["active", "draft", "paused"];

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const automations = await getTaxAutomations(user.uid);
  return NextResponse.json({ automations });
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

  const body = (await request.json()) as Partial<NewTaxAutomationInput>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre de la automatización es obligatorio" }, { status: 400 });
  }
  if (!body.triggerType || !VALID_TRIGGERS.includes(body.triggerType)) {
    return NextResponse.json({ error: "Trigger inválido" }, { status: 400 });
  }
  if (!body.actionType || !VALID_ACTIONS.includes(body.actionType)) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const input: NewTaxAutomationInput = {
    name: body.name.trim(),
    status: body.status && VALID_STATUSES.includes(body.status) ? body.status : "draft",
    triggerType: body.triggerType,
    triggerConfig: body.triggerConfig || {},
    actionType: body.actionType,
    actionConfig: body.actionConfig || {}
  };

  try {
    const automation = await addTaxAutomation(user.uid, input);
    return NextResponse.json({ success: true, automation });
  } catch (error) {
    console.error("Error creando automatización fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

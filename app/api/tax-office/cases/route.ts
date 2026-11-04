import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxCases, addTaxCase } from "@/lib/services/tax-office-service";
import { NewTaxCaseInput } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const cases = await getTaxCases(user.uid);
  return NextResponse.json({ cases });
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

  const body = (await request.json()) as Partial<NewTaxCaseInput>;
  if (!body.clientName?.trim()) {
    return NextResponse.json({ error: "El nombre del cliente es obligatorio" }, { status: 400 });
  }
  if (!body.clientPhone?.trim() && !body.clientEmail?.trim()) {
    return NextResponse.json({ error: "Ingresa al menos un teléfono o correo de contacto" }, { status: 400 });
  }

  const input: NewTaxCaseInput = {
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail?.trim() || "sin-correo@e360.com",
    clientPhone: body.clientPhone?.trim() || "No especificado",
    taxYear: body.taxYear || new Date().getFullYear(),
    serviceType: body.serviceType || "1040_personal",
    filingStatus: body.filingStatus,
    agreedFee: Number(body.agreedFee) || 0,
    bankProduct: Boolean(body.bankProduct),
    bankPartner: body.bankProduct ? body.bankPartner : "none",
    refundAdvanceRequested: Boolean(body.bankProduct && body.refundAdvanceRequested),
    estimatedRefund: body.estimatedRefund,
    assignedPreparer: body.assignedPreparer,
    notes: body.notes?.trim(),
    irsAckCode: body.irsAckCode
  };

  try {
    const newCase = await addTaxCase(user.uid, input);
    return NextResponse.json({ success: true, case: newCase });
  } catch (error) {
    console.error("Error creando caso fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

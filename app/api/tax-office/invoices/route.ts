import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxInvoices, addTaxInvoice } from "@/lib/services/tax-office-service";
import { NewTaxInvoiceInput } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const invoices = await getTaxInvoices(user.uid);
  return NextResponse.json({ invoices });
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

  const body = (await request.json()) as Partial<NewTaxInvoiceInput>;
  if (!body.clientName?.trim()) {
    return NextResponse.json({ error: "El nombre del cliente es obligatorio" }, { status: 400 });
  }

  const input: NewTaxInvoiceInput = {
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail?.trim() || "cliente@gmail.com",
    amount: Number(body.amount) || 0,
    paymentMethod: body.paymentMethod || "refund_deduction",
    taxYear: body.taxYear || new Date().getFullYear(),
    caseId: body.caseId
  };

  try {
    const newInvoice = await addTaxInvoice(user.uid, input);
    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error("Error creando factura fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxInvoiceStatus } from "@/lib/services/tax-office-service";
import { TaxInvoiceStatus } from "@/app/hub/broker-onboarding/types";

const VALID_STATUSES: TaxInvoiceStatus[] = ["draft", "sent", "paid", "failed", "refunded", "cancelled"];

export async function PATCH(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { invoiceId } = await params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as TaxInvoiceStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    await updateTaxInvoiceStatus(user.uid, invoiceId, body.status as TaxInvoiceStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando estado de la factura fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    const status = message === "Factura no encontrada" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

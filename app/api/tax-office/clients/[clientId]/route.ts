import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxClientStatus } from "@/lib/services/tax-office-service";
import { TaxClientStatus } from "@/app/hub/broker-onboarding/types";

const VALID_STATUSES: TaxClientStatus[] = ["lead", "active", "pending", "waiting_docs", "in_review", "completed", "inactive", "archived"];

export async function PATCH(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { clientId } = await params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as TaxClientStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    await updateTaxClientStatus(user.uid, clientId, body.status as TaxClientStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando estado del cliente fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

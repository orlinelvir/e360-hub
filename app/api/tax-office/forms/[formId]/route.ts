import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxFormTemplate } from "@/lib/services/tax-office-service";
import { TaxFormTemplate } from "@/app/hub/broker-onboarding/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { formId } = await params;
  const body = (await request.json()) as Partial<
    Pick<TaxFormTemplate, "name" | "headerText" | "logoUrl" | "logoSize" | "logoAlignment" | "pages" | "attachmentStoragePath" | "attachmentName">
  >;

  try {
    await updateTaxFormTemplate(user.uid, formId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando formulario fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

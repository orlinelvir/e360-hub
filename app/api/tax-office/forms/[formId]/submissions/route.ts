import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxFormSubmissions } from "@/lib/services/tax-office-service";

export async function GET(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { formId } = await params;
  const all = await getTaxFormSubmissions(user.uid);
  const submissions = all.filter((s) => s.formTemplateId === formId);
  return NextResponse.json({ submissions });
}

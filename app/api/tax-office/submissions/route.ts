import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxFormSubmissions } from "@/lib/services/tax-office-service";

// Igual que /api/tax-office/forms/[formId]/submissions pero sin filtrar por
// un formulario — para el Dashboard, que necesita el total de envíos de
// todos los formularios de la oficina, no los de uno en particular.
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const submissions = await getTaxFormSubmissions(user.uid);
  return NextResponse.json({ submissions });
}

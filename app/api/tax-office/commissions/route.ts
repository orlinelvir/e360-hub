import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxCommissions, addTaxCommission } from "@/lib/services/tax-office-service";
import { NewTaxCommissionInput } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const commissions = await getTaxCommissions(user.uid);
  return NextResponse.json({ commissions });
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

  const body = (await request.json()) as Partial<NewTaxCommissionInput>;
  if (!body.preparerName?.trim()) {
    return NextResponse.json({ error: "El nombre del preparador es obligatorio" }, { status: 400 });
  }
  if (!body.grossVolume || !body.splitPercentage) {
    return NextResponse.json({ error: "Volumen bruto y porcentaje de split son obligatorios" }, { status: 400 });
  }

  const input: NewTaxCommissionInput = {
    preparerName: body.preparerName.trim(),
    preparerEmail: body.preparerEmail?.trim() || "sin-correo@e360.com",
    totalReturns: Number(body.totalReturns) || 0,
    grossVolume: Number(body.grossVolume) || 0,
    splitPercentage: Number(body.splitPercentage) || 0,
    underMentorship: Boolean(body.underMentorship)
  };

  try {
    const newCommission = await addTaxCommission(user.uid, input);
    return NextResponse.json({ success: true, commission: newCommission });
  } catch (error) {
    console.error("Error creando comisión fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

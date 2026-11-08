import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxClients, addTaxClient } from "@/lib/services/tax-office-service";
import { NewTaxClientInput, TaxClientStatus } from "@/app/hub/broker-onboarding/types";

const VALID_STATUSES: TaxClientStatus[] = ["lead", "active", "pending", "waiting_docs", "in_review", "completed", "inactive", "archived"];

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const clients = await getTaxClients(user.uid);
  return NextResponse.json({ clients });
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

  const body = (await request.json()) as Partial<NewTaxClientInput>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre del cliente es obligatorio" }, { status: 400 });
  }
  if (!body.phone?.trim() && !body.email?.trim()) {
    return NextResponse.json({ error: "Ingresa al menos un teléfono o correo de contacto" }, { status: 400 });
  }

  const input: NewTaxClientInput = {
    name: body.name.trim(),
    email: body.email?.trim() || "",
    phone: body.phone?.trim() || "",
    status: body.status && VALID_STATUSES.includes(body.status) ? body.status : "lead",
    notes: body.notes?.trim()
  };

  try {
    const newClient = await addTaxClient(user.uid, input);
    return NextResponse.json({ success: true, client: newClient });
  } catch (error) {
    console.error("Error creando cliente fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxAppointments, addTaxAppointment } from "@/lib/services/tax-office-service";
import { NewTaxAppointmentInput, TaxAppointmentIntegration } from "@/app/hub/broker-onboarding/types";

const VALID_INTEGRATIONS: TaxAppointmentIntegration[] = ["none", "zoom", "google_meet", "phone"];

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const appointments = await getTaxAppointments(user.uid);
  return NextResponse.json({ appointments });
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

  const body = (await request.json()) as Partial<NewTaxAppointmentInput>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "El título de la cita es obligatorio" }, { status: 400 });
  }
  if (!body.dateTime) {
    return NextResponse.json({ error: "La fecha y hora son obligatorias" }, { status: 400 });
  }

  const input: NewTaxAppointmentInput = {
    title: body.title.trim(),
    type: body.type?.trim() || "Consulta",
    dateTime: body.dateTime,
    durationMinutes: Number(body.durationMinutes) || 30,
    relatedClientId: body.relatedClientId,
    location: body.location?.trim(),
    meetingIntegration: body.meetingIntegration && VALID_INTEGRATIONS.includes(body.meetingIntegration) ? body.meetingIntegration : "none",
    label: body.label?.trim()
  };

  try {
    const appointment = await addTaxAppointment(user.uid, input);
    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("Error creando cita fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

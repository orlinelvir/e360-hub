import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { getTimeEntriesForStaff, addTimeEntry, getStaffContractInfo } from "@/lib/services/staff-time-service";

// Self-service de horas trabajadas — solo para staff/admin (roles !== "broker"),
// cada quien ve y registra únicamente sus propias entradas (uid del token,
// nunca uno recibido en el body).
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (role === "broker") {
    return NextResponse.json({ error: "El registro de horas es solo para el equipo interno" }, { status: 403 });
  }

  const [entries, contractInfo] = await Promise.all([getTimeEntriesForStaff(user.uid), getStaffContractInfo(user.uid)]);
  return NextResponse.json({ entries, ...contractInfo });
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (role === "broker") {
    return NextResponse.json({ error: "El registro de horas es solo para el equipo interno" }, { status: 403 });
  }

  const body = await request.json();
  const { date, hoursWorked, note } = body;

  if (!date || typeof hoursWorked !== "number" || hoursWorked <= 0) {
    return NextResponse.json({ error: "date y hoursWorked (mayor a 0) son requeridos" }, { status: 400 });
  }
  if (hoursWorked > 24) {
    return NextResponse.json({ error: "hoursWorked no puede ser mayor a 24" }, { status: 400 });
  }

  const entry = await addTimeEntry(user.uid, { date, hoursWorked, note: note || undefined });
  return NextResponse.json({ entry });
}

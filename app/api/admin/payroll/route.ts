import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import {
  getHourlyStaffMembers,
  getTimeEntriesInRange,
  getPayrollRecords,
  upsertPayrollRecord
} from "@/lib/services/staff-time-service";

// Nómina/reconciliación de staff por hora — admin-only. Las horas y la
// tarifa SIEMPRE se recalculan aquí desde las fuentes autoritativas (entradas
// de tiempo + tarifa guardada en el perfil del empleado), nunca se confía en
// un monto que el cliente mande — solo `actualPaid`/`notes` son datos que el
// admin realmente aporta.
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (role !== "admin") {
    return NextResponse.json({ error: "Acceso restringido. Se requiere rol de SuperAdmin." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart y periodEnd son requeridos" }, { status: 400 });
  }

  const [hourlyStaff, entries, existingRecords] = await Promise.all([
    getHourlyStaffMembers(),
    getTimeEntriesInRange(periodStart, periodEnd),
    getPayrollRecords(periodStart, periodEnd)
  ]);

  const recordByUid = new Map(existingRecords.map((r) => [r.staffUid, r]));

  const rows = hourlyStaff.map((staff) => {
    const hoursLogged = entries.filter((e) => e.staffUid === staff.uid).reduce((acc, e) => acc + e.hoursWorked, 0);
    const expectedPay = Math.round(hoursLogged * staff.hourlyRateUSD * 100) / 100;
    const existing = recordByUid.get(staff.uid);
    return {
      staffUid: staff.uid,
      staffName: staff.displayName,
      periodStart,
      periodEnd,
      hoursLogged,
      hourlyRate: staff.hourlyRateUSD,
      expectedPay,
      actualPaid: existing?.actualPaid,
      paidAt: existing?.paidAt,
      notes: existing?.notes
    };
  });

  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (role !== "admin") {
    return NextResponse.json({ error: "Acceso restringido. Se requiere rol de SuperAdmin." }, { status: 403 });
  }

  const body = await request.json();
  const { staffUid, periodStart, periodEnd, actualPaid, notes } = body;

  if (!staffUid || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "staffUid, periodStart y periodEnd son requeridos" }, { status: 400 });
  }

  const [hourlyStaff, entries] = await Promise.all([getHourlyStaffMembers(), getTimeEntriesInRange(periodStart, periodEnd)]);
  const staff = hourlyStaff.find((s) => s.uid === staffUid);
  if (!staff) {
    return NextResponse.json({ error: "Empleado no encontrado o no tiene tarifa por hora configurada" }, { status: 404 });
  }

  const hoursLogged = entries.filter((e) => e.staffUid === staffUid).reduce((acc, e) => acc + e.hoursWorked, 0);
  const expectedPay = Math.round(hoursLogged * staff.hourlyRateUSD * 100) / 100;

  const record = await upsertPayrollRecord({
    staffUid,
    staffName: staff.displayName,
    periodStart,
    periodEnd,
    hoursLogged,
    hourlyRate: staff.hourlyRateUSD,
    expectedPay,
    actualPaid: typeof actualPaid === "number" ? actualPaid : undefined,
    notes: typeof notes === "string" ? notes : undefined
  });

  return NextResponse.json({ record });
}

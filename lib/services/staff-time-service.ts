import { adminDb } from "@/lib/firebase-admin";
import { TimeEntry, NewTimeEntryInput, PayrollRecord } from "@/app/hub/broker-onboarding/types";

/**
 * Control de Horas y Nómina de staff interno (no brokers) — mismo patrón de
 * Admin SDK únicamente que el resto de módulos admin-sensibles del proyecto
 * (ver tax-office-service.ts). Las entradas de horas viven anidadas bajo
 * brokers/{uid}/timeEntries (mismo uid que usa todo el sistema de roles para
 * staff/admin, ver lib/roles.ts), pero se consultan en agregado vía
 * collectionGroup para las vistas de nómina que cruzan todo el equipo.
 */

function brokerDoc(uid: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(uid);
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

// --- Registro de Horas ---

export async function getTimeEntriesForStaff(uid: string): Promise<TimeEntry[]> {
  const snap = await brokerDoc(uid).collection("timeEntries").orderBy("date", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TimeEntry);
}

export async function addTimeEntry(uid: string, input: NewTimeEntryInput): Promise<TimeEntry> {
  const payload = {
    staffUid: uid,
    date: input.date,
    hoursWorked: input.hoursWorked,
    note: input.note,
    createdAt: new Date().toISOString()
  };
  const ref = await brokerDoc(uid).collection("timeEntries").add(stripUndefined(payload));
  return { id: ref.id, ...payload };
}

// Rango inclusivo — las fechas son strings YYYY-MM-DD, comparables
// lexicográficamente sin parsear a Date.
export async function getTimeEntriesInRange(periodStart: string, periodEnd: string): Promise<TimeEntry[]> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const snap = await adminDb
    .collectionGroup("timeEntries")
    .where("date", ">=", periodStart)
    .where("date", "<=", periodEnd)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TimeEntry);
}

// Info de contrato del propio usuario autenticado — expuesta aparte en vez de
// agregarla a BrokerProfileData (el perfil genérico que useAuth() trae para
// TODOS los usuarios) para no mezclar datos de compensación con el resto del
// perfil, y para evitar la colisión de nombres con contractSignedAt/
// contractSignedMethod, que son sobre la firma del contrato de servicios del
// BROKER con E360 — un concepto completamente distinto.
export interface StaffContractInfo {
  contractType?: "hourly" | "salary" | "commission";
  hourlyRateUSD?: number;
  weeklyHoursExpected?: number;
}

export async function getStaffContractInfo(uid: string): Promise<StaffContractInfo> {
  const snap = await brokerDoc(uid).get();
  const data = snap.data() || {};
  return {
    contractType: data.contractType,
    hourlyRateUSD: typeof data.hourlyRateUSD === "number" ? data.hourlyRateUSD : undefined,
    weeklyHoursExpected: typeof data.weeklyHoursExpected === "number" ? data.weeklyHoursExpected : undefined
  };
}

// --- Staff con tarifa por hora (para calcular nómina) ---

export interface HourlyStaffMember {
  uid: string;
  displayName: string;
  hourlyRateUSD: number;
}

export async function getHourlyStaffMembers(): Promise<HourlyStaffMember[]> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const snap = await adminDb.collection("brokers").where("contractType", "==", "hourly").get();
  return snap.docs
    .filter((d) => typeof d.data().hourlyRateUSD === "number")
    .map((d) => ({
      uid: d.id,
      displayName: d.data().displayName || d.data().name || "Empleado",
      hourlyRateUSD: d.data().hourlyRateUSD as number
    }));
}

// --- Nómina / Reconciliación ---

function payrollDocId(staffUid: string, periodStart: string, periodEnd: string) {
  return `${staffUid}_${periodStart}_${periodEnd}`;
}

export async function getPayrollRecords(periodStart: string, periodEnd: string): Promise<PayrollRecord[]> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const snap = await adminDb
    .collection("payrollRecords")
    .where("periodStart", "==", periodStart)
    .where("periodEnd", "==", periodEnd)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PayrollRecord);
}

export async function getPayrollRecordsForStaff(uid: string): Promise<PayrollRecord[]> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const snap = await adminDb.collection("payrollRecords").where("staffUid", "==", uid).orderBy("periodStart", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PayrollRecord);
}

export async function upsertPayrollRecord(
  input: Pick<PayrollRecord, "staffUid" | "staffName" | "periodStart" | "periodEnd" | "hoursLogged" | "hourlyRate" | "expectedPay"> &
    Partial<Pick<PayrollRecord, "actualPaid" | "notes">>
): Promise<PayrollRecord> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const id = payrollDocId(input.staffUid, input.periodStart, input.periodEnd);
  const ref = adminDb.collection("payrollRecords").doc(id);
  const payload = {
    ...input,
    paidAt: input.actualPaid !== undefined ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString()
  };
  await ref.set(stripUndefined(payload), { merge: true });
  const saved = await ref.get();
  return { id: ref.id, ...saved.data() } as PayrollRecord;
}

// Módulo sin dependencias de servidor (nada de firebase-admin) — extraído de
// app/api/cron/pending-case-alerts/route.ts para poder probarlo sin mockear
// Next.js, y porque es lógica pura de fecha/hora que no necesita vivir en la
// ruta del cron.

export const THRESHOLDS_HOURS = [24, 48, 72] as const;

// El negocio opera en hora del Este de EE.UU. (igual que los horarios de
// soporte en DepartmentCards.tsx/prompts.ts) — Vercel corre los cron en UTC,
// así que usar Date.getDay() (hora del servidor) podía adelantar o atrasar
// el límite de fin de semana varias horas según la hora del día.
export const BUSINESS_TIMEZONE = "America/New_York";

export function isWeekdayInBusinessTimezone(date: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TIMEZONE, weekday: "short" }).format(date);
  return weekday !== "Sat" && weekday !== "Sun";
}

// Cuenta solo horas de lunes a viernes entre `fromISO` y `to` — un caso
// creado el viernes en la tarde no debe "cumplir 24 horas" el sábado en la
// mañana, tal como se pidió explícitamente excluir fines de semana.
export function businessHoursElapsed(fromISO: string, to: Date): number {
  const from = new Date(fromISO);
  if (Number.isNaN(from.getTime())) return 0;
  let hours = 0;
  const cursor = new Date(from);
  while (cursor < to) {
    if (isWeekdayInBusinessTimezone(cursor)) hours += 1;
    cursor.setTime(cursor.getTime() + 60 * 60 * 1000);
  }
  return hours;
}

export function highestThresholdReached(hours: number): number {
  let reached = 0;
  for (const t of THRESHOLDS_HOURS) {
    if (hours >= t) reached = t;
  }
  return reached;
}

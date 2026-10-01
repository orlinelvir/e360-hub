// SLA (Acuerdo de Nivel de Servicio) de respuesta para tickets de soporte.
// Este es el compromiso público que se anunció a la comunidad: tickets en 24h,
// seguros en 48h — la prioridad alta es "urgente" y por eso responde en 4h.
// Se usa en el formulario de creación, el listado/detalle del broker, el panel
// admin (métricas) y el cron de escalación automática.

export type TicketPriority = "low" | "medium" | "high";

export const TICKET_SLA_HOURS: Record<TicketPriority, number> = {
  low: 72,
  medium: 24,
  high: 4
};

/** Horas de compromiso de respuesta según prioridad (default: media = 24h). */
export function getTicketSlaHours(priority: string | undefined): number {
  return TICKET_SLA_HOURS[priority as TicketPriority] ?? TICKET_SLA_HOURS.medium;
}

/** Etiqueta larga para el formulario, ej. "24 horas", "1 día". */
export function getTicketSlaLabel(priority: string | undefined): string {
  const hours = getTicketSlaHours(priority);
  if (hours >= 24) {
    const days = hours / 24;
    return days === 1 ? "24 horas (1 día)" : `${days} días`;
  }
  return `${hours} horas`;
}

/** Etiqueta corta para chips, ej. "24h". */
export function getTicketSlaShortLabel(priority: string | undefined): string {
  return `${getTicketSlaHours(priority)}h`;
}

/**
 * ¿El SLA de respuesta está vencido? Solo aplica a tickets sin primera
 * respuesta: una vez que el equipo contesta, el compromiso de respuesta ya se
 * cumplió (o se midió) y lo que importa es la resolución.
 */
export function isResponseSlaBreached(
  ticket: { createdAt: string; firstResponseAt?: string; status?: string; priority?: string },
  now: number = Date.now()
): boolean {
  if (ticket.firstResponseAt || ticket.status === "resolved") return false;
  const createdMs = Date.parse(ticket.createdAt);
  if (Number.isNaN(createdMs)) return false;
  return now - createdMs > getTicketSlaHours(ticket.priority) * 3_600_000;
}

/** ¿Se resolvió dentro del SLA de su prioridad? (para métricas de % cumplido) */
export function wasResolvedWithinSla(ticket: {
  createdAt: string;
  resolvedAt?: string;
  priority?: string;
}): boolean {
  if (!ticket.resolvedAt) return false;
  const createdMs = Date.parse(ticket.createdAt);
  const resolvedMs = Date.parse(ticket.resolvedAt);
  if (Number.isNaN(createdMs) || Number.isNaN(resolvedMs)) return false;
  return resolvedMs - createdMs <= getTicketSlaHours(ticket.priority) * 3_600_000;
}

/** Duración legible en horas cortas, ej. "3h 20m", "1d 6h". */
export function formatDurationMs(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

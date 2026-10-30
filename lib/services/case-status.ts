// Antes, un solo campo `status` en el documento del cliente mezclaba el
// resultado de sincronización con GHL (synced/failed_sync/pending_sync) con
// el resultado real de revisión de la solicitud (approved/rejected/funded/
// in_progress). Un caso que nadie había revisado todavía podía aparecer con
// una etiqueta técnica como "Sincronizado" en vez de algo honesto como
// "Pendiente de Documentos" — este módulo separa ambos conceptos en dos
// campos (`status` = revisión, `syncStatus` = sincronización) sin requerir
// una migración masiva: deriveCaseStatus() interpreta los casos viejos que
// solo tienen el campo mezclado.
//
// Módulo sin dependencias de servidor (nada de firebase-admin) — seguro de
// importar tanto en componentes de cliente como en rutas de servidor.

export type ReviewStatus = "pending_docs" | "in_review" | "approved" | "rejected" | "funded";
export type SyncStatus = "pending" | "synced" | "failed";

// Etapa visible para el broker en "Mis Clientes" — debe mantenerse en sync con
// PipelineStage de app/hub/broker-onboarding/types.ts y stageLabels en
// MisClientesSection.tsx.
export type PipelineStage =
  | "lead"
  | "qualification"
  | "docs_pending"
  | "submitted"
  | "approved"
  | "paid"
  | "rejected";

/**
 * Convierte el estado real de revisión (ReviewStatus) en la etapa que ve el
 * broker en su dashboard. Así cuando GHL/Admin actualiza `status`, el broker
 * ve el movimiento reflejado en `stage` sin depender de sincronización manual.
 */
export function mapReviewStatusToPipelineStage(status: ReviewStatus): PipelineStage {
  switch (status) {
    case "pending_docs":
      return "docs_pending";
    case "in_review":
      return "submitted";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "funded":
      return "paid";
    default:
      return "lead";
  }
}

export const VALID_REVIEW_STATUSES: ReviewStatus[] = ["pending_docs", "in_review", "approved", "rejected", "funded"];

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const REVIEW_STATUS_META: Record<ReviewStatus, StatusMeta> = {
  pending_docs: { label: "Pendiente de Documentos", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  in_review: { label: "En Revisión", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  approved: { label: "Aprobado", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  rejected: { label: "Declinado", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" },
  funded: { label: "Fondeado / Pagado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" }
};

export const SYNC_STATUS_META: Record<SyncStatus, StatusMeta> = {
  pending: { label: "Sync Pendiente", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" },
  synced: { label: "Sincronizado GHL", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  failed: { label: "Fallo de Sync", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" }
};

// Reparación de Crédito es una suscripción de $10/mes, no un préstamo —
// "Aprobar / Declinar / Marcar Fondeado" (ReviewStatus de arriba) no tiene
// sentido ahí ("Fondeado" en particular: no hay ningún monto que se
// desembolse). Vocabulario aparte, específico para este cluster.
export type CreditRepairStatus = "pending_verification" | "active" | "paused" | "cancelled" | "declined";

export const VALID_CREDIT_REPAIR_STATUSES: CreditRepairStatus[] = [
  "pending_verification", "active", "paused", "cancelled", "declined"
];

export const CREDIT_REPAIR_STATUS_META: Record<CreditRepairStatus, StatusMeta> = {
  pending_verification: { label: "Pendiente de Verificación", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  active: { label: "Activo", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  paused: { label: "Pausado", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  cancelled: { label: "Cancelado", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" },
  declined: { label: "Declinado", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" }
};

export function isValidCreditRepairStatus(value: string | undefined): value is CreditRepairStatus {
  return !!value && (VALID_CREDIT_REPAIR_STATUSES as string[]).includes(value);
}

interface RawCaseStatus {
  status?: string;
  syncStatus?: string;
}

export function deriveCaseStatus(
  raw: RawCaseStatus,
  cluster?: string
): { reviewStatus: ReviewStatus; syncStatus: SyncStatus; creditRepairStatus?: CreditRepairStatus } {
  let syncStatus: SyncStatus;
  if (raw.syncStatus === "synced" || raw.syncStatus === "failed" || raw.syncStatus === "pending") {
    syncStatus = raw.syncStatus;
  } else if (raw.status === "synced") {
    syncStatus = "synced";
  } else if (raw.status === "failed_sync") {
    syncStatus = "failed";
  } else {
    syncStatus = "pending";
  }

  if (cluster === "credit_repair") {
    const creditRepairStatus: CreditRepairStatus = isValidCreditRepairStatus(raw.status)
      ? raw.status
      : "pending_verification";

    // Cubeta genérica SOLO para vistas agregadas que no conocen este
    // vocabulario (Métricas, Actividad del Staff, Cola de Sync, alertas de
    // caso atrasado) — deciden si "necesita atención" o no, nunca se
    // muestra como texto (eso lo hace CREDIT_REPAIR_STATUS_META).
    const reviewStatus: ReviewStatus =
      creditRepairStatus === "pending_verification" ? "pending_docs" :
      creditRepairStatus === "active" ? "funded" :
      "rejected"; // paused / cancelled / declined — ya no requieren seguimiento

    return { reviewStatus, syncStatus, creditRepairStatus };
  }

  const status = raw.status;

  let reviewStatus: ReviewStatus;
  if (status === "approved" || status === "rejected" || status === "funded" || status === "pending_docs") {
    reviewStatus = status;
  } else if (status === "in_progress" || status === "in_review") {
    reviewStatus = "in_review";
  } else {
    // "synced" / "failed_sync" / "pending_sync" / vacío: nunca hubo una
    // revisión humana real registrada, sin importar si el CRM se sincronizó.
    reviewStatus = "pending_docs";
  }

  return { reviewStatus, syncStatus };
}

// true cuando una transición representa el primer momento en que un caso
// queda respaldado por una revisión/confirmación real — el punto correcto
// para avisarle al cliente que "recibimos tu aplicación".
export function justGotVerified(previous: ReviewStatus, next: ReviewStatus): boolean {
  return previous === "pending_docs" && next !== "pending_docs";
}

// Traduce el nombre de etapa/status que reporta el webhook de GHL
// (app/api/webhooks/ghl/route.ts) al ReviewStatus autoritativo del Hub. Vive
// aquí (no en el route handler) para poder probarla sin mockear Next.js/Firebase.
export function mapGHLStageToHubStatus(stageName: string, ghlStatus: string): ReviewStatus {
  const name = (stageName || "").toLowerCase();
  const status = (ghlStatus || "").toLowerCase();

  if (status === "won" || name.includes("fund") || name.includes("fondead") || name.includes("pagado") || name.includes("paid") || name.includes("closed won") || name.includes("emitida")) {
    return "funded";
  }
  if (name.includes("approv") || name.includes("aprob") || name.includes("oferta") || name.includes("offer") || name.includes("firmado") || name.includes("contrato")) {
    return "approved";
  }
  if (status === "lost" || status === "abandoned" || name.includes("lost") || name.includes("declin") || name.includes("reject") || name.includes("cancel") || name.includes("no califica")) {
    return "rejected";
  }
  // Cualquier movimiento real de etapa en el pipeline de GHL (incluida esta
  // rama por defecto) implica que alguien ya está trabajando el caso — nunca
  // debe quedar clasificado como "pendiente de documentos".
  return "in_review";
}

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

interface RawCaseStatus {
  status?: string;
  syncStatus?: string;
}

export function deriveCaseStatus(raw: RawCaseStatus): { reviewStatus: ReviewStatus; syncStatus: SyncStatus } {
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

  let syncStatus: SyncStatus;
  if (raw.syncStatus === "synced" || raw.syncStatus === "failed" || raw.syncStatus === "pending") {
    syncStatus = raw.syncStatus;
  } else if (status === "synced") {
    syncStatus = "synced";
  } else if (status === "failed_sync") {
    syncStatus = "failed";
  } else {
    syncStatus = "pending";
  }

  return { reviewStatus, syncStatus };
}

// true cuando una transición representa el primer momento en que un caso
// queda respaldado por una revisión/confirmación real — el punto correcto
// para avisarle al cliente que "recibimos tu aplicación".
export function justGotVerified(previous: ReviewStatus, next: ReviewStatus): boolean {
  return previous === "pending_docs" && next !== "pending_docs";
}

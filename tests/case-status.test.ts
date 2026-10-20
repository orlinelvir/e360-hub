import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveCaseStatus, justGotVerified, mapGHLStageToHubStatus } from "../lib/services/case-status";

test("deriveCaseStatus - caso nuevo sin status queda pending_docs/pending", () => {
  const { reviewStatus, syncStatus } = deriveCaseStatus({});
  assert.equal(reviewStatus, "pending_docs");
  assert.equal(syncStatus, "pending");
});

test("deriveCaseStatus - status legacy 'synced' se interpreta como pending_docs + syncStatus synced", () => {
  // Este es el patrón mezclado que motivó separar los 2 campos: 'synced' nunca
  // significó que alguien revisó el caso, solo que el CRM se sincronizó.
  const { reviewStatus, syncStatus } = deriveCaseStatus({ status: "synced" });
  assert.equal(reviewStatus, "pending_docs");
  assert.equal(syncStatus, "synced");
});

test("deriveCaseStatus - status legacy 'failed_sync' se interpreta como pending_docs + syncStatus failed", () => {
  const { reviewStatus, syncStatus } = deriveCaseStatus({ status: "failed_sync" });
  assert.equal(reviewStatus, "pending_docs");
  assert.equal(syncStatus, "failed");
});

test("deriveCaseStatus - 'in_progress' es alias de in_review", () => {
  assert.equal(deriveCaseStatus({ status: "in_progress" }).reviewStatus, "in_review");
});

test("deriveCaseStatus - syncStatus explícito gana sobre el derivado de status", () => {
  const { syncStatus } = deriveCaseStatus({ status: "approved", syncStatus: "pending" });
  assert.equal(syncStatus, "pending");
});

test("deriveCaseStatus - estados de revisión reales pasan directo", () => {
  for (const s of ["approved", "rejected", "funded", "pending_docs"] as const) {
    assert.equal(deriveCaseStatus({ status: s }).reviewStatus, s);
  }
});

test("justGotVerified - true solo en la primera salida de pending_docs", () => {
  assert.equal(justGotVerified("pending_docs", "approved"), true);
  assert.equal(justGotVerified("pending_docs", "in_review"), true);
  assert.equal(justGotVerified("in_review", "approved"), false);
  assert.equal(justGotVerified("pending_docs", "pending_docs"), false);
});

test("mapGHLStageToHubStatus - detecta fondeado/ganado", () => {
  assert.equal(mapGHLStageToHubStatus("Deal Funded & Paid", "open"), "funded");
  assert.equal(mapGHLStageToHubStatus("Cualquier etapa", "won"), "funded");
});

test("mapGHLStageToHubStatus - detecta aprobado", () => {
  assert.equal(mapGHLStageToHubStatus("Offer Approved", "open"), "approved");
});

test("mapGHLStageToHubStatus - detecta rechazado/perdido", () => {
  assert.equal(mapGHLStageToHubStatus("Declined by Bank", "lost"), "rejected");
  assert.equal(mapGHLStageToHubStatus("Cualquier etapa", "abandoned"), "rejected");
});

test("mapGHLStageToHubStatus - cualquier otro movimiento real de etapa es in_review, nunca pending_docs", () => {
  assert.equal(mapGHLStageToHubStatus("Underwriting In Review", "open"), "in_review");
  assert.equal(mapGHLStageToHubStatus("New Lead Inbox", "open"), "in_review");
});

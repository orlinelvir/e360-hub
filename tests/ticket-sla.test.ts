import { test } from "node:test";
import assert from "node:assert/strict";
import { isResponseSlaBreached, wasResolvedWithinSla, getTicketSlaHours } from "../lib/support/ticket-sla";

const HOUR = 3_600_000;

test("getTicketSlaHours - prioridad desconocida cae al default de media (24h)", () => {
  assert.equal(getTicketSlaHours(undefined), 24);
  assert.equal(getTicketSlaHours("prioridad_inventada"), 24);
});

test("isResponseSlaBreached - prioridad media vencida tras 25 horas sin respuesta", () => {
  const createdAt = new Date(Date.now() - 25 * HOUR).toISOString();
  assert.equal(isResponseSlaBreached({ createdAt, priority: "medium" }), true);
});

test("isResponseSlaBreached - prioridad alta vencida tras solo 5 horas (SLA de 4h)", () => {
  const createdAt = new Date(Date.now() - 5 * HOUR).toISOString();
  assert.equal(isResponseSlaBreached({ createdAt, priority: "high" }), true);
});

test("isResponseSlaBreached - no vencido si ya hubo primera respuesta, sin importar cuánto pasó", () => {
  const createdAt = new Date(Date.now() - 100 * HOUR).toISOString();
  assert.equal(isResponseSlaBreached({ createdAt, priority: "low", firstResponseAt: new Date().toISOString() }), false);
});

test("isResponseSlaBreached - un ticket ya resuelto nunca cuenta como SLA de respuesta vencido", () => {
  const createdAt = new Date(Date.now() - 100 * HOUR).toISOString();
  assert.equal(isResponseSlaBreached({ createdAt, priority: "high", status: "resolved" }), false);
});

test("wasResolvedWithinSla - true cuando se resolvió justo en el límite del SLA (inclusive)", () => {
  const createdAt = "2026-01-01T00:00:00.000Z";
  const resolvedAt = "2026-01-02T00:00:00.000Z"; // exactamente 24h después
  assert.equal(wasResolvedWithinSla({ createdAt, resolvedAt, priority: "medium" }), true);
});

test("wasResolvedWithinSla - false si se resolvió 1 minuto después del límite", () => {
  const createdAt = "2026-01-01T00:00:00.000Z";
  const resolvedAt = "2026-01-02T00:01:00.000Z";
  assert.equal(wasResolvedWithinSla({ createdAt, resolvedAt, priority: "medium" }), false);
});

test("wasResolvedWithinSla - sin resolvedAt siempre es false (no se puede medir)", () => {
  assert.equal(wasResolvedWithinSla({ createdAt: new Date().toISOString(), priority: "medium" }), false);
});

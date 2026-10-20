import { test } from "node:test";
import assert from "node:assert/strict";
import { mapGHLStageToHubStatus } from "../lib/services/case-status";

// Antes esta prueba reimplementaba la función inline en vez de importar la
// real — quedó desincronizada hasta devolver valores ("in_progress", "synced")
// que ya ni siquiera son ReviewStatus válidos en el código actual. El ✓ verde
// no protegía nada. Ahora importa la función real del webhook.
test("GHL Webhook Stage Mapper - mapGHLStageToHubStatus (función real) verification", () => {
  assert.equal(mapGHLStageToHubStatus("Deal Funded & Paid", "open"), "funded");
  assert.equal(mapGHLStageToHubStatus("Underwriting In Review", "open"), "in_review");
  assert.equal(mapGHLStageToHubStatus("Offer Approved", "open"), "approved");
  assert.equal(mapGHLStageToHubStatus("Declined by Bank", "lost"), "rejected");
  assert.equal(mapGHLStageToHubStatus("New Lead Inbox", "open"), "in_review");
});

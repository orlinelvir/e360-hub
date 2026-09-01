import { test } from "node:test";
import assert from "node:assert/strict";

test("GHL Webhook Stage Mapper verification", () => {
  // Simular la función de mapeo de estados
  function mapGHLStageToHubStatus(stageName: string, ghlStatus: string): string {
    const name = (stageName || "").toLowerCase();
    const status = (ghlStatus || "").toLowerCase();

    if (status === "won" || name.includes("fund") || name.includes("fondead") || name.includes("pagado") || name.includes("paid")) {
      return "funded";
    }
    if (name.includes("approv") || name.includes("aprob") || name.includes("oferta") || name.includes("offer")) {
      return "approved";
    }
    if (status === "lost" || status === "abandoned" || name.includes("lost") || name.includes("declin") || name.includes("reject")) {
      return "rejected";
    }
    if (name.includes("underwrit") || name.includes("revis") || name.includes("proceso") || name.includes("evaluac") || name.includes("docs")) {
      return "in_progress";
    }
    return "synced";
  }

  assert.equal(mapGHLStageToHubStatus("Deal Funded & Paid", "open"), "funded");
  assert.equal(mapGHLStageToHubStatus("Underwriting In Review", "open"), "in_progress");
  assert.equal(mapGHLStageToHubStatus("Offer Approved", "open"), "approved");
  assert.equal(mapGHLStageToHubStatus("Declined by Bank", "lost"), "rejected");
  assert.equal(mapGHLStageToHubStatus("New Lead Inbox", "open"), "synced");
});

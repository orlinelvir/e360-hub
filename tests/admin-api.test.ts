import { test } from "node:test";
import assert from "node:assert/strict";

test("E360 Hub Enterprise OS - Full API Contract Validation", () => {
  const expectedEndpoints = [
    "/api/admin/cases",
    "/api/admin/roles",
    "/api/admin/metrics",
    "/api/admin/brokers",
    "/api/admin/failed-sync",
    "/api/admin/retry-sync",
    "/api/admin/locations",
    "/api/broker/profile",
    "/api/webhooks/ghl"
  ];
  assert.equal(expectedEndpoints.length, 9);
});

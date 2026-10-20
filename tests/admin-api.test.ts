import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Antes esto comparaba un array hardcodeado contra sí mismo
// (assert.equal(expectedEndpoints.length, 9)) — pasaba siempre, sin importar
// si esas rutas existían o no. Ahora al menos verifica que cada endpoint
// esperado tenga un route.ts real en el repo.
const expectedEndpoints = [
  "app/api/admin/cases/route.ts",
  "app/api/admin/roles/route.ts",
  "app/api/admin/metrics/route.ts",
  "app/api/admin/brokers/onboarding/route.ts",
  "app/api/admin/failed-sync/route.ts",
  "app/api/admin/retry-sync/route.ts",
  "app/api/admin/locations/route.ts",
  "app/api/broker/profile/route.ts",
  "app/api/webhooks/ghl/route.ts"
];

test("E360 Hub - rutas de admin esperadas existen como archivos reales", () => {
  for (const relativePath of expectedEndpoints) {
    const fullPath = resolve(import.meta.dirname, "..", relativePath);
    assert.ok(existsSync(fullPath), `Falta el archivo de ruta: ${relativePath}`);
  }
});

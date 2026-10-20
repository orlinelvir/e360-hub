import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeServiceOverride } from "../lib/services/service-catalog-shared";
import { servicesData } from "../app/hub/broker-onboarding/data/services";

const baseService = servicesData[0];

test("mergeServiceOverride - sin override devuelve el servicio base sin tocarlo", () => {
  assert.deepEqual(mergeServiceOverride(baseService, undefined), baseService);
});

test("mergeServiceOverride - solo sobreescribe los campos presentes en el override", () => {
  const merged = mergeServiceOverride(baseService, { title: "Título Editado por Admin" });
  assert.equal(merged.title, "Título Editado por Admin");
  assert.equal(merged.comission, baseService.comission);
  assert.equal(merged.id, baseService.id);
});

test("mergeServiceOverride - un campo estructural en el override (no está en OVERRIDABLE_KEYS) se ignora", () => {
  // pipelineCluster/centralDepartment no son overridables a propósito: cambiarlos
  // afectaría el enrutamiento a GHL y las comisiones vía código no revisado.
  const merged = mergeServiceOverride(baseService, {
    // @ts-expect-error - probando que un campo no declarado en ServiceOverride se ignore
    pipelineCluster: "credit_repair"
  });
  assert.equal(merged.pipelineCluster, baseService.pipelineCluster);
});

test("mergeServiceOverride - un valor explícitamente undefined en el override no borra el valor real", () => {
  const merged = mergeServiceOverride(baseService, { status: undefined, title: "Nuevo Título" });
  assert.equal(merged.status, baseService.status);
  assert.equal(merged.title, "Nuevo Título");
});

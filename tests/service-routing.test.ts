import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePipelineCluster, resolveCentralDepartment } from "../lib/service-routing";
import { servicesData } from "../app/hub/broker-onboarding/data/services";

test("resolvePipelineCluster - usa el catálogo cuando el serviceId existe", () => {
  const real = servicesData.find((s) => s.id === "mortgage-loan")!;
  assert.equal(resolvePipelineCluster("mortgage-loan", undefined), real.pipelineCluster);
});

test("resolvePipelineCluster - fallback por palabra clave para leads legacy sin serviceId", () => {
  assert.equal(resolvePipelineCluster(undefined, "DSCR Investment Loan"), "real_estate");
  assert.equal(resolvePipelineCluster(undefined, "Reparación de Crédito Express"), "credit_repair");
  assert.equal(resolvePipelineCluster(undefined, "Póliza de Seguro Auto"), "seguros");
  assert.equal(resolvePipelineCluster(undefined, "Registro de LLC"), "corporativo");
});

test("resolvePipelineCluster - sin match de ninguna palabra clave cae a fondeo_rapido por defecto", () => {
  assert.equal(resolvePipelineCluster(undefined, "Servicio sin nombre reconocible"), "fondeo_rapido");
});

test("resolveCentralDepartment - usa el catálogo cuando el serviceId existe", () => {
  const real = servicesData.find((s) => s.id === "auto-insurance")!;
  assert.equal(resolveCentralDepartment("auto-insurance", undefined), real.centralDepartment);
});

test("resolveCentralDepartment - fallback por palabra clave: 'credit' cae en 'financial', no hay rama de credit_repair", () => {
  // Documenta el comportamiento real: resolveCentralDepartment no tiene un
  // caso explícito para reparación de crédito, así que un lead legacy sin
  // serviceId ("Credit Repair Service") cae en el departamento financiero por
  // la palabra "credit" antes de llegar a cualquier otra revisión.
  assert.equal(resolveCentralDepartment(undefined, "Credit Repair Service"), "financial");
});

test("resolveCentralDepartment - sin match cae a 'corporate' por defecto", () => {
  assert.equal(resolveCentralDepartment(undefined, "Servicio sin nombre reconocible"), "corporate");
});

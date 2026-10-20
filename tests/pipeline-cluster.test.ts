import { test } from "node:test";
import assert from "node:assert/strict";
import { servicesData } from "../app/hub/broker-onboarding/data/services";

test("Catálogo de servicios - todos los 19 servicios tienen un pipelineCluster válido", () => {
  assert.equal(servicesData.length, 19, "El catálogo debe contener exactamente 19 servicios");

  const validClusters = new Set(["fondeo_rapido", "real_estate", "credit_repair", "debt_consolidation", "seguros", "corporativo"]);

  for (const service of servicesData) {
    assert.ok(service.pipelineCluster, `El servicio ${service.id} debe tener un pipelineCluster definido`);
    assert.ok(validClusters.has(service.pipelineCluster), `El cluster ${service.pipelineCluster} de ${service.id} debe ser válido`);
  }
});

test("Distribución de clusters en los servicios de E360", () => {
  const mca = servicesData.find(s => s.id === "business-loan");
  const mortgage = servicesData.find(s => s.id === "mortgage-loan");
  const creditRepair = servicesData.find(s => s.id === "credit-repair");
  const debtNegotiation = servicesData.find(s => s.id === "adios-deudas");
  const autoInsurance = servicesData.find(s => s.id === "auto-insurance");
  const incorporation = servicesData.find(s => s.id === "incorporation");

  assert.equal(mca?.pipelineCluster, "fondeo_rapido");
  assert.equal(mortgage?.pipelineCluster, "real_estate");
  assert.equal(creditRepair?.pipelineCluster, "credit_repair");
  assert.equal(debtNegotiation?.pipelineCluster, "debt_consolidation");
  assert.equal(autoInsurance?.pipelineCluster, "seguros");
  assert.equal(incorporation?.pipelineCluster, "corporativo");
});

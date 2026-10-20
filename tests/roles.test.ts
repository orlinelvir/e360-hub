import { test } from "node:test";
import assert from "node:assert/strict";
import { hasPermission, isMasterAdminEmail, getRoleDefinition, getRoleIdsForCluster, getRoleIdsForTicketCategory } from "../lib/roles";

test("hasPermission - admin tiene cualquier permiso vía el comodín 'all'", () => {
  assert.equal(hasPermission("admin", "algo_que_no_existe"), true);
});

test("hasPermission - broker no tiene permisos de staff", () => {
  assert.equal(hasPermission("broker", "view_tickets"), false);
  assert.equal(hasPermission("broker", "edit_cases"), false);
});

test("hasPermission - rol inexistente nunca tiene permisos (sin lanzar error)", () => {
  assert.equal(hasPermission("rol_que_no_existe", "view_cases"), false);
});

test("hasPermission - un rol de especialista solo tiene sus permisos declarados", () => {
  assert.equal(hasPermission("specialist_real_estate", "edit_cases"), true);
  assert.equal(hasPermission("specialist_real_estate", "manage_brokers"), false);
});

test("isMasterAdminEmail - normaliza mayúsculas y espacios", () => {
  assert.equal(isMasterAdminEmail(" Soporte@Emprende360.INFO "), true);
  assert.equal(isMasterAdminEmail("soporte@emprende360.info"), true);
});

test("isMasterAdminEmail - rechaza correos que no están en la lista, null o undefined", () => {
  assert.equal(isMasterAdminEmail("broker-cualquiera@gmail.com"), false);
  assert.equal(isMasterAdminEmail(null), false);
  assert.equal(isMasterAdminEmail(undefined), false);
});

test("getRoleDefinition - devuelve undefined para un id de rol que no existe", () => {
  assert.equal(getRoleDefinition("rol_fantasma"), undefined);
});

test("getRoleIdsForCluster - excluye 'broker' aunque técnicamente tenga allowedClusters vacío", () => {
  const ids = getRoleIdsForCluster("corporativo");
  assert.ok(!ids.includes("broker"));
  assert.ok(ids.includes("specialist_corporate"));
  assert.ok(ids.includes("onboarding_member"));
});

test("getRoleIdsForCluster - un cluster sin especialista dedicado solo devuelve los roles de alcance general", () => {
  const ids = getRoleIdsForCluster("fondeo_rapido");
  assert.ok(ids.includes("underwriter_mca"));
  assert.ok(ids.includes("admin"));
});

test("getRoleIdsForTicketCategory - categoría conocida devuelve sus roles específicos", () => {
  const ids = getRoleIdsForTicketCategory("corporate_tax");
  assert.ok(ids.includes("specialist_corporate"));
  assert.ok(ids.includes("support_agent"));
});

test("getRoleIdsForTicketCategory - categoría desconocida cae al default (support_agent, admin)", () => {
  assert.deepEqual(getRoleIdsForTicketCategory("categoria_inventada"), ["support_agent", "admin"]);
});

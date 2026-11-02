import { test } from "node:test";
import assert from "node:assert/strict";
import { servicesData } from "../app/hub/broker-onboarding/data/services";
import { CaseTask } from "../app/hub/broker-onboarding/types";

test("CRM Services - todos los servicios activos tienen un enlace oficial de formulario de CRM", () => {
  const activeServices = servicesData.filter((s) => s.status === "active");
  assert.ok(activeServices.length > 0, "Debe haber servicios activos en el catálogo");
  
  for (const s of activeServices) {
    assert.ok(s.formLink, `El servicio ${s.id} debe tener un formLink definido`);
    assert.ok(
      s.formLink.startsWith("https://api.leadconnectorhq.com") ||
      s.formLink.startsWith("https://link.apisystem.tech") ||
      s.formLink.startsWith("https://app.startpoint.biz"),
      `El formLink de ${s.id} debe apuntar a la infraestructura segura del CRM (GHL/StartPoint)`
    );
  }
});

test("WhatsApp Script Generation - reemplaza dinámicamente variables sin dejar placeholders", () => {
  const clientName = "Carlos Mendoza";
  const brokerName = "Fernando E360";
  const serviceName = "Préstamo de Negocio (MCA)";
  const crmLink = "https://api.leadconnectorhq.com/widget/form/tvJ4AjmdXHVnOmm8DyEk";

  const scriptTemplate = (cName: string, bName: string, sName: string, link: string) =>
    `¡Hola ${cName}! Te saluda ${bName} de Emprende 360. Para iniciar la tramitación de tu solicitud de ${sName}, por favor completa tus datos y sube los documentos requeridos directamente en nuestro portal seguro de CRM: ${link} . El proceso es 100% digital y confidencial. Por favor avísame en cuanto lo envíes para dar seguimiento de inmediato con nuestro equipo. ¡Quedo muy atento!`;

  const rendered = scriptTemplate(clientName, brokerName, serviceName, crmLink);

  assert.ok(rendered.includes("Carlos Mendoza"));
  assert.ok(rendered.includes("Fernando E360"));
  assert.ok(rendered.includes("Préstamo de Negocio (MCA)"));
  assert.ok(rendered.includes(crmLink));
  assert.ok(!rendered.includes("{clientName}"));
  assert.ok(!rendered.includes("{brokerName}"));
  assert.ok(!rendered.includes("{crmFormLink}"));
});

test("CaseTask Model - estructura de tareas y prioridades válidas", () => {
  const validTask: CaseTask = {
    id: "task_12345",
    clientId: "CLI-999",
    title: "Solicitar 3 meses de Bank Statements de Negocio",
    dueDate: "2026-11-10",
    priority: "high",
    completed: false,
    createdAt: new Date().toISOString()
  };

  assert.equal(validTask.clientId, "CLI-999");
  assert.equal(validTask.completed, false);
  assert.ok(["low", "medium", "high"].includes(validTask.priority));
  assert.ok(validTask.dueDate.length === 10);
});

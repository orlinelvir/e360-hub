import { test } from "node:test";
import assert from "node:assert/strict";
import { servicesData } from "../app/hub/broker-onboarding/data/services";
import { CaseTask } from "../app/hub/broker-onboarding/types";
import { TEMPLATES, cleanPhone } from "../app/hub/broker-onboarding/components/crm-tools/WhatsAppQuickScriptsModal";
import { isTaskOverdue } from "../app/hub/broker-onboarding/components/crm-tools/CaseTasksSection";

// Único valor que el catálogo usa para marcar un servicio como "todavía sin
// formulario real" — ver app/hub/broker-onboarding/data/services.ts. No todo
// servicio activo usa GHL/StartPoint (Seguros va a ZIS, AdiosDeudas a su
// propia página de Canva, Inmigración/Taxes a Calendly) — eso es correcto a
// propósito, no un bug. Lo único que de verdad debe fallar aquí es un
// formLink que no sea ni una URL real ni este placeholder reconocido.
const PLACEHOLDER_FORM_LINK = "Formulario en desarrollo";

test("CRM Services - todo servicio activo tiene un formLink real o el placeholder reconocido de 'en desarrollo'", () => {
  const activeServices = servicesData.filter((s) => s.status === "active");
  assert.ok(activeServices.length > 0, "Debe haber servicios activos en el catálogo");

  for (const s of activeServices) {
    assert.ok(s.formLink, `El servicio ${s.id} debe tener un formLink definido`);
    const isRealUrl = /^https:\/\//.test(s.formLink);
    const isKnownPlaceholder = s.formLink === PLACEHOLDER_FORM_LINK;
    assert.ok(
      isRealUrl || isKnownPlaceholder,
      `El formLink de ${s.id} ("${s.formLink}") no es ni una URL real ni el placeholder reconocido de "en desarrollo"`
    );
  }
});

test("WhatsApp Scripts - las 4 plantillas reales sustituyen variables sin dejar placeholders", () => {
  const clientName = "Carlos Mendoza";
  const brokerName = "Fernando E360";
  const serviceName = "Préstamo de Negocio (MCA)";
  const crmLink = "https://api.leadconnectorhq.com/widget/form/tvJ4AjmdXHVnOmm8DyEk";

  assert.equal(TEMPLATES.length, 4, "Deben existir las 4 plantillas documentadas");

  for (const tmpl of TEMPLATES) {
    const rendered = tmpl.generateText(clientName, brokerName, serviceName, crmLink);

    // brokerName no aparece en las 4 (ej. "case_submitted" no lo usa, es un
    // seguimiento sin firma personal) — solo clientName/serviceName son
    // universales a las 4 plantillas.
    assert.ok(rendered.includes(clientName), `${tmpl.id} debe incluir el nombre del cliente`);
    assert.ok(rendered.includes(serviceName), `${tmpl.id} debe incluir el nombre del servicio`);
    // Ningún placeholder sin resolver de ningún formato (ni ${}, ni {}).
    assert.ok(!/\$\{|\{client|\{broker|\{service|\{crm/i.test(rendered), `${tmpl.id} no debe dejar placeholders sin resolver`);
  }

  // Solo las plantillas 1 y 2 (intake/reminder) de verdad incluyen el enlace del CRM.
  const templatesWithLink = TEMPLATES.filter((t) => t.generateText(clientName, brokerName, serviceName, crmLink).includes(crmLink));
  assert.equal(templatesWithLink.map((t) => t.category).sort().join(","), "intake,reminder");
});

test("WhatsApp Scripts - cleanPhone normaliza números reales de EE.UU.", () => {
  assert.equal(cleanPhone("917-284-5636"), "19172845636");
  assert.equal(cleanPhone("+1 (917) 284-5636"), "19172845636");
  assert.equal(cleanPhone(""), "", "Un teléfono vacío no debe inventar dígitos");
});

test("CaseTask Model - isTaskOverdue no mezcla UTC con hora local", () => {
  const today = new Date(2026, 10, 2); // 2 de noviembre de 2026, hora LOCAL (mes 0-index)

  const dueToday: CaseTask = {
    id: "t1", clientId: "CLI-1", title: "Vence hoy", dueDate: "2026-11-02",
    priority: "high", completed: false, createdAt: today.toISOString()
  };
  const dueYesterday: CaseTask = {
    id: "t2", clientId: "CLI-1", title: "Venció ayer", dueDate: "2026-11-01",
    priority: "high", completed: false, createdAt: today.toISOString()
  };
  const dueTomorrow: CaseTask = {
    id: "t3", clientId: "CLI-1", title: "Vence mañana", dueDate: "2026-11-03",
    priority: "high", completed: false, createdAt: today.toISOString()
  };
  const completedPastDue: CaseTask = {
    id: "t4", clientId: "CLI-1", title: "Venció pero ya está lista", dueDate: "2026-11-01",
    priority: "low", completed: true, createdAt: today.toISOString()
  };

  assert.equal(isTaskOverdue(dueToday, today), false, "Una tarea que vence HOY nunca debe marcarse vencida");
  assert.equal(isTaskOverdue(dueYesterday, today), true, "Una tarea vencida ayer sí debe marcarse vencida");
  assert.equal(isTaskOverdue(dueTomorrow, today), false, "Una tarea futura no debe marcarse vencida");
  assert.equal(isTaskOverdue(completedPastDue, today), false, "Una tarea ya completada nunca es 'vencida' aunque pasó la fecha");
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

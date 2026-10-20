import { test } from "node:test";
import assert from "node:assert/strict";
import { businessHoursElapsed, highestThresholdReached } from "../lib/services/business-hours";

test("businessHoursElapsed - excluye el fin de semana completo (viernes 3pm a lunes 9am, hora del Este)", () => {
  const fridayNoonET = "2026-10-09T19:00:00.000Z"; // viernes 9 oct 2026, 3pm EDT
  const mondayET = new Date("2026-10-12T13:00:00.000Z"); // lunes 12 oct 2026, 9am EDT
  // 9h el viernes (3pm-medianoche) + 9h el lunes (medianoche-9am) = 18, sin contar sábado/domingo.
  assert.equal(businessHoursElapsed(fridayNoonET, mondayET), 18);
});

test("businessHoursElapsed - mismo instante de inicio y fin da 0 horas", () => {
  const now = new Date("2026-10-07T15:00:00.000Z"); // miércoles
  assert.equal(businessHoursElapsed(now.toISOString(), now), 0);
});

test("businessHoursElapsed - una fecha de origen inválida devuelve 0 en vez de lanzar o ciclar infinito", () => {
  assert.equal(businessHoursElapsed("esto-no-es-una-fecha", new Date()), 0);
});

test("businessHoursElapsed - dentro de la misma semana laboral cuenta horas normalmente", () => {
  const mondayMorning = "2026-10-05T13:00:00.000Z"; // lunes 9am EDT
  const mondayAfternoon = new Date("2026-10-05T19:00:00.000Z"); // lunes 3pm EDT
  assert.equal(businessHoursElapsed(mondayMorning, mondayAfternoon), 6);
});

test("highestThresholdReached - devuelve el umbral más alto alcanzado, 0 si ninguno", () => {
  assert.equal(highestThresholdReached(10), 0);
  assert.equal(highestThresholdReached(24), 24);
  assert.equal(highestThresholdReached(47), 24);
  assert.equal(highestThresholdReached(48), 48);
  assert.equal(highestThresholdReached(100), 72);
});

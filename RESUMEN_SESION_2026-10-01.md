# Resumen de Sesión — E360 Hub
**Fecha:** 1 de octubre de 2026
**Alcance:** Crisis de la comunidad de brokers · Fixes del Hub · Extensión completa de Soporte y Tickets

---

## 1. Contexto: Crisis de confianza en la comunidad

**Situación:** La comunidad de brokers en WhatsApp entró en crisis por reclamos repetidos de mala comunicación: créditos que nunca se resolvieron, seguros sin respuesta ("nunca me devolvieron la respuesta"), quejas por falta de herramientas de ventas, y conflicto abierto entre brokers (Hector Osorio vs Munguia Capital).

**Trabajo realizado:**
- Análisis de las capturas del chat y diagnóstico de los reclamos.
- Conflicto broker vs broker: resuelto por el GM; mensaje de reglas del grupo enviado.
- **Reglas oficiales del grupo** publicadas, pineadas y bien recibidas (respuestas positivas de An y Wendy; 6 reacciones). Grupo configurado para que solo admins escriban. Reglas incluyen: respeto absoluto, conflictos → ticket en Hub, solo casos FUNCED publicables, plataformas con enlaces oficiales (Hub `https://emprende360.biz`, CRM `https://app.startpoint.biz`, Librería `https://e360library.com`) y contactos por departamento. **Sin el número personal del GM.**

---

## 2. Diagnóstico y fixes del Hub (Fase 1 — 5 fixes)

| # | Problema detectado | Solución implementada | Archivos |
|---|---|---|---|
| **1** | Sync bidireccional GHL→Hub incompleto: el pipeline de GHL actualizaba `status` pero no `stage` | Nuevo `PipelineStage` + `mapReviewStatusToPipelineStage()`; webhook escribe ambos; `"rejected"` agregado al tipo; dropdown manual del broker filtra rechazados | `lib/services/case-status.ts`, `app/api/webhooks/ghl/route.ts`, `app/hub/broker-onboarding/types.ts`, `MisClientesSection.tsx` |
| **2** | FAQs hardcodeadas, imposibles de actualizar sin deploy | `getFaqs()` lee Firestore (`supportKnowledge`) con fallback hardcodeado; endpoint nuevo; componente reescrito con loading/error/categoría inferida | `lib/ai/knowledge-base.ts`, `app/api/support/faqs/route.ts`, `FAQSection.tsx` |
| **3** | Seguros sin compromiso de respuesta visible (reclamo directo del chat) | Campo `sla` en los 7 servicios de seguros, editable por admin, con badge "Compromiso de Respuesta" en el detalle | `app/hub/broker-onboarding/data/services.ts`, `lib/services/service-catalog-shared.ts`, `AdminServicesTab.tsx`, `BrokerOnboardingClient.tsx` |
| **4** | Reclamo "falta de herramientas de ventas" | Nueva pestaña **Recursos**: plantillas de posts, scripts, enlaces a biblioteca y horarios | `ResourcesSection.tsx` (nuevo), `BrokerOnboardingClient.tsx` |
| **5** | Verificación de sospechas | Verificar Sync (`/api/ghl/validate`), enlace de referido, unificación de tickets en `enhancedTickets` y rate-limit del chat IA (20 msg/5 min) **ya funcionaban** — no se tocó | — |

---

## 3. Base de conocimiento del asistente IA

- **14 FAQs** del documento Google de la comunidad agregadas a `FALLBACK_FAQS` (ahora exportado) en `lib/ai/knowledge-base.ts`.
- Script `scripts/seed-faqs.ts` + comando **`npm run seed:faqs`** para poblar `supportKnowledge` en Firestore.
- Reglas de Firestore verificadas: lectura autenticada / escritura admin en `supportKnowledge`.
- ⚠️ **Pendiente:** ¿el `seed:faqs` ya se corrió en producción? (Si no, correrlo una vez.)
- ⚠️ **Pendiente:** análisis exhaustivo del Drive `Documentos/GoogleDrive/E360/` para reforzar el asistente (excluyendo carpetas de datos sensibles de clientes: `Credit Hero Score/Clients/`, `Docs de clientes/`, `Loan applications/`, `Form Submissions/`, `Insurance form Submitions/`).

---

## 4. Extensión de Soporte y Tickets — Diagnóstico

Análisis completo de la sección contra los reclamos del chat → **2 críticos, 3 importantes, 2 opcionales**. Todo implementado:

### 🔴 CRÍTICOS (implementados y verificados)

**Crítico #1 — El broker no se enteraba cuando le respondían**
*(explicaba literalmente "abrí un ticket y nadie me contestó")*
- Al responder desde Admin → **notificación in-app** (campana, `link: "soporte"`) + **correo** con asunto del ticket y preview de 180 caracteres.
- Plantilla nueva `lib/email/templates/TicketUpdateEmail.tsx` + `sendTicketReplyEmail()` / `sendTicketResolvedEmail()` en `lib/email/send.tsx`.
- Archivo: `app/api/admin/tickets/messages/route.ts`.

**Crítico #2 — El cierre de tickets era silencioso + no había reapertura**
- Al marcar "Resuelto" (solo en transición real, sin duplicados) → notificación + correo de resolución.
- **Botón "Reabrir ticket"** en `TicketDetail.tsx` — antes un ticket resuelto dejaba al broker sin opción alguna.
- Al reabrir → **el staff de esa categoría es notificado** (el ticket no puede volver a quedarse invisible).
- Archivos: `app/api/admin/tickets/route.ts`, `TicketDetail.tsx`, `app/api/support/tickets/route.ts`.

### 🟡 IMPORTANTES (implementados)

**1. SLA visible en tickets**
- Helper compartido nuevo **`lib/support/ticket-sla.ts`**: alta = 4h, media = 24h, baja = 72h (el público ya fue anunciado: "tickets en 24h").
- **Formulario de creación** (`EscalationModal.tsx`): línea "Compromiso de respuesta de Soporte E360: 24 horas" que cambia con la prioridad; labels del select actualizados (`Alta (Respuesta en 4h)`).
- **Listado del broker** (`TicketList.tsx`): chips `SLA 24h` / `SLA vencido` (rojo, cálculo en tiempo real) / `Escalado`.
- **Detalle del broker** (`TicketDetail.tsx`): mismos chips en el header.

**2. Escalación automática por tiempo**
- Cron nuevo **`/api/cron/ticket-escalations`** (patrón idéntico a `credit-repair-rounds`, autenticado con `CRON_SECRET`).
- Escala cuando: (a) SLA de respuesta vencido sin primera respuesta, o (b) 72h sin actividad en cualquier ticket activo (abierto o en proceso).
- Acción: marca `escalated: true` + motivo, y **notifica al staff de la categoría** (siempre incluye `admin`).
- Se **desescala solo** cuando un agente responde o cambia el estado (`escalatedAt` queda como histórico).
- Programado en **`vercel.json`**: diario `0 15 * * *` UTC. ⚠️ **Vercel Hobby solo permite crons diarios** (falla el deploy con horarios más frecuentes) — con plan Pro, cambiar el `schedule` a horario para escalar cada hora.
- El chip "SLA vencido" en la UI es en tiempo real; el cron agrega el flag + la notificación.

**3. Métricas de soporte en el admin**
- Franja de **8 tarjetas** en `AdminTicketsTab.tsx`: Abiertos · En proceso · Resueltos · **SLA vencidos** · **Escalados** · **1ª respuesta promedio** · **% SLA cumplido** · **Satisfacción ★**.
- Campos nuevos en el ticket: `firstResponseAt` (se fija al primer mensaje del agente), `resolvedAt` (se fija al resolver, dentro de `updateTicketStatus`).
- Chips en filas: ★calificación, "Escalado", "SLA vencido"; banner púrpura con el motivo de escalación en el hilo; ★ del broker en la barra de estado.

### 🟢 OPCIONALES (implementados)

**1. Encuesta de satisfacción al resolver**
- Con el ticket resuelto: **estrellas 1-5** en `TicketDetail.tsx` (feedback optimista, se revierte si el servidor rechaza).
- Endpoint: `PATCH /api/support/tickets` acepta `rating`, valida 1-5 y que el ticket esté resuelto, guarda `rating`/`ratedAt`.
- **Calificaciones 1-2 → notificación in-app inmediata al staff** para reabrir/contactar (una queja mala nunca puede quedar silenciosa).
- Visible en el panel admin (fila + hilo) y promedio en métricas.

**2. Notificación al broker cuando GHL cambia el estado de su caso**
- El webhook de GHL actualizaba el caso pero **no avisaba al broker** — ahora, en transiciones reales a `approved` / `rejected` / `funded` (mismos `NOTIFIABLE_STATUSES` del panel admin):
  - **Correo** `sendCaseStatusEmail` (✅ Aprobado / ⚠️ Declinado / 💰 Fondeado).
  - **Notificación in-app** `link: "clientes"`.
- Detecta cambio real leyendo el estado previo (webhooks repetidos no duplican avisos).
- Archivo: `app/api/webhooks/ghl/route.ts`.

---

## 5. Archivos nuevos creados

| Archivo | Propósito |
|---|---|
| `lib/support/ticket-sla.ts` | SLA compartido: horas por prioridad, detección de vencimiento, formato de duración |
| `lib/email/templates/TicketUpdateEmail.tsx` | Plantilla de correo "respondió" / "resuelto" |
| `app/api/cron/ticket-escalations/route.ts` | Cron diario de escalación automática por SLA |
| `app/api/support/faqs/route.ts` | Endpoint de FAQs dinámicas |
| `app/hub/broker-onboarding/components/ResourcesSection.tsx` | Pestaña Recursos (herramientas de marketing) |
| `scripts/seed-faqs.ts` | Seed de las 14 FAQs en Firestore (`npm run seed:faqs`) |

---

## 6. Verificación final

| Check | Resultado |
|---|---|
| `npm run typecheck` (tsc --noEmit) | ✅ 0 errores |
| `npm run lint` (eslint, todo el proyecto) | ✅ 0 errores |
| `npm test` | ✅ 6/6 tests |
| `npm run build` (next build) | ✅ OK — rutas nuevas compiladas |

---

## 7. ⚠️ Pendientes y notas operativas

1. **No commiteado/desplegado**: todos los cambios están en local. Commitear → Vercel hace el deploy.
2. **`npm run seed:faqs`** — verificar si ya se corrió en producción (puebla las 14 FAQs en Firestore).
3. **Hueco simétrico detectado**: si el *broker* responde a un ticket existente, el staff no recibe notificación (solo al crearlo). Mejora pendiente por decisión del GM (riesgo de ruido).
4. **Deep-link**: al clickear una notificación de ticket se cae en Soporte pestaña IA, no directo en "Mis Tickets" (1 clic extra). Polish opcional.
5. **Vercel Hobby**: el cron de escalación corre 1 vez/día (15:00–15:59 UTC ≈ 11am ET). Con Pro → escalación horaria cambiando una línea en `vercel.json`.
6. **Env vars necesarias en Vercel**: `RESEND_API_KEY` (correos), `CRON_SECRET` (crons), `NEXT_PUBLIC_APP_URL=https://emprende360.biz`, `GHL_WEBHOOK_SECRET`.
7. **PDF de contactos** (`Emprende 360 — Contactos por Departamento.pdf`): el asistente no puede leer PDFs — pegarlo como texto para verificar los números en `knowledge-base.ts`.
8. **Análisis del Drive** (`GoogleDrive/E360/`) para reforzar el asistente IA: pendiente, excluyendo carpetas de datos sensibles de clientes.
9. **Contactos por departamento** en `knowledge-base.ts` (verificar contra el PDF del usuario): Anthony +1 (747) 966-4788 (underwriting), Fernando +1 (201) 365-2055 (CRM/crédito), Mario +1 (917) 284-5636 (soporte), JP +1 (862) 424-4738 (préstamos), Pete +1 (732) 362-1347 (hipotecarios), Valentina +1 (908) 733-2891 (taxes/inmigración), Laura +1 (775) 369-4853 (onboarding), Samantha +1 (786) 481-0166 (marketing).

---

## 8. Flujo completo de tickets resultante (estado final)

```
Broker crea ticket (SLA visible según prioridad)
  → Staff notificado (in-app, por categoría)
  → Agente responde → Broker notificado (in-app + correo) + firstResponseAt se fija
  → Agente marca "Resuelto" → Broker notificado (in-app + correo)
      → Broker califica 1-5 estrellas (1-2 → alerta inmediata al staff)
      → Si no quedó resuelto: "Reabrir ticket" → staff notificado
  → Si nadie responde en el SLA (4h/24h/72h) o 72h sin actividad
      → Cron lo escala: flag + motivo + notificación al staff/admin
  → Métricas en el panel admin: SLA cumplido, 1ª respuesta prom., satisfacción
```

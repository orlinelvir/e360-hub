================================================================================
        CONTEXTO PARA OPENCODE GO — TRABAJO REALIZADO POR CLAUDE CODE
================================================================================
Última actualización: 2026-08-26 (segunda pasada, misma fecha)
Objetivo: Continuar desde donde quedó Claude Code. Todo lo de abajo ya está
commiteado y pusheado a GitHub (main).

--------------------------------------------------------------------------------
1. DOCUMENTOS DE REFERENCIA GENERADOS (léelos primero)
--------------------------------------------------------------------------------
- AUDITORIA_2026-08-25.md — auditoría completa del código: arquitectura, qué
  funciona, qué es beta/mock, hallazgos de seguridad.
- ESTRATEGIA_GHL_2026-08-25.md — inventario de los 18 servicios del catálogo,
  qué se aprovecha de GHL y qué no, cómo organizar pipelines/departamentos.

--------------------------------------------------------------------------------
2. SEGURIDAD Y CALIDAD DE CÓDIGO (ya resuelto)
--------------------------------------------------------------------------------
- lib/crypto.ts: ya NO degrada a una clave hardcodeada si falta
  ENCRYPTION_SECRET en producción — falla explícito (throw).
- 93 problemas de `npm run lint` corregidos (0 errores, 0 warnings). Lint ya
  está en el CI (.github/workflows/ci.yml).
- next.config.ts: `turbopack.root` fijado (un package.json/node_modules
  huérfano en la carpeta padre rompía `npm run dev`).
- `AdminPanelSection.tsx` (lista de subcuentas de agencia) cableado en la UI.
- package.json: `deploy:rules` despliega Firestore Y Storage
  (`firebase deploy --only firestore:rules,storage`).

--------------------------------------------------------------------------------
3. ENRUTAMIENTO GHL POR DEPARTAMENTO (Tarea #1 — completo)
--------------------------------------------------------------------------------
- `app/hub/broker-onboarding/data/services.ts`: cada uno de los 18 servicios
  tiene `centralDepartment: "financial" | "insurance" | "corporate"` explícito.
- `services/submit/route.ts`: enruta por `serviceId` real, ya no por keyword
  matching (ese heurístico solo queda como fallback).
- Env vars nuevas: `GHL_E360_CORPORATE_LOCATION_ID` / `GHL_E360_CORPORATE_API_KEY`
  — PENDIENTE que el usuario las configure con valores reales.

PENDIENTE (Tarea #2, sin empezar): definir y crear 5 pipelines por cluster de
negocio (Fondeo Rápido, Real Estate, Credit Repair, Seguros, Corporativo) en
las subcuentas centrales — `createOpportunityInPipeline()` en lib/ghl.ts sigue
tomando "el primer pipeline/primera etapa que encuentra". Bloqueado: falta que
el usuario confirme si ya existen o los creamos juntos. Ver sección 4 de
ESTRATEGIA_GHL_2026-08-25.md.

--------------------------------------------------------------------------------
4. FLUJO DE REPARACIÓN DE CRÉDITO (Tarea #3 — completo)
--------------------------------------------------------------------------------
Contexto de negocio:
- Fee de $10 recurrente (mismo concepto en el onboarding Y en cada ronda
  mensual). Pago vía: https://link.fastpaydirect.com/payment-link/6a8688d6f9c8c807930b9166
- Formulario oficial de aplicación GHL:
  https://api.leadconnectorhq.com/widget/form/hXr9MAZMR8AHID3LC5cg
- Plataformas compatibles con Credit Repair Cloud: IdentityIQ, SmartCredit,
  MyFreeScoreNow, MyScoreIQ, PrivacyGuard. MyFreeScoreNow sirve para SSN e
  ITIN, pero para ITIN se usa un TOKEN en vez de contraseña.

Construido:
- Firebase Storage configurado desde cero — storage.rules deniega acceso
  directo del cliente; todo pasa por Admin SDK (`adminStorage` en
  lib/firebase-admin.ts).
- `POST /api/services/credit-repair-intake` — recibe formulario + comprobante
  de pago, cifra credenciales sensibles (contraseña/token/últimos 4 SSN) con
  lib/crypto.ts, sube el comprobante, crea el lead y sincroniza a GHL.
- Firestore: `brokers/{uid}/clients/{clientId}/creditRepairCase/case`
  (credenciales cifradas) y `.../feeRounds/{roundId}` (status
  pending_review/paid, con clientEmail/brokerId/leadId denormalizados).
- `CreditRepairIntakeModal.tsx` — modal de 2 pasos, reemplaza a
  `AdmisionFormModal` específicamente para "credit-repair".
- `data/services.ts`: formLink de Reparación de Crédito apunta al formulario
  oficial de arriba (ya no "Formulario en desarrollo").

--------------------------------------------------------------------------------
5. AUTOMATIZACIÓN MENSUAL DEL FEE (Tarea #5 — completo)
--------------------------------------------------------------------------------
- Nuevo cron `GET /api/cron/credit-repair-rounds` (app/api/cron/credit-repair-rounds/route.ts),
  disparado diario por Vercel Cron (ver vercel.json, horario `0 13 * * *` UTC).
  Autenticado con `CRON_SECRET` (Vercel lo inyecta automático como header
  Authorization si la env var existe — YA CONFIRMADO agregado en Vercel por
  el usuario).
- Por cada cliente de Reparación de Crédito cuya última ronda tenga 30+ días,
  crea automáticamente la siguiente ronda ($10, pending_review). Se detiene
  en la ronda 12 (duración típica del programa).
- El estado del fee se refleja directo en el documento del cliente
  (`feeRoundStatus`, `feeRoundNumber`) y se ve como badge (ámbar/verde) en la
  tarjeta del cliente en "Mis Clientes" (`MisClientesSection.tsx`) — no se
  construyó un sistema de notificaciones nuevo porque la colección
  `notifications` existe en las reglas de Firestore pero nadie la lee en
  ningún lado del código (se sigue escribiendo ahí también, por si acaso, pero
  no es la vía principal).
- El webhook de pagos (sección 6) también actualiza este mismo badge cuando
  confirma el pago de una ronda.

--------------------------------------------------------------------------------
6. WEBHOOKS ENTRANTES DE GHL (Tarea #6 — completo y PROBADO end-to-end)
--------------------------------------------------------------------------------
Endpoint: `POST /api/webhooks/ghl` (app/api/webhooks/ghl/route.ts)
Autenticado por header `x-webhook-secret` == env var `GHL_WEBHOOK_SECRET`.

>>> HALLAZGO IMPORTANTE (ya corregido, aprender de esto): GHL anida todo lo
que se define en "Custom Data" de la acción Webhook dentro de un objeto
`customData` en el JSON que envía — NO va en la raíz. Confirmado inspeccionando
un payload real con webhook.site. El código lee `body.customData || body`
como fallback defensivo. Si algún día se agrega un tercer evento con su propio
Custom Data, recordar este detalle.

a) "payment_received" — marca pagada la ronda de fee correspondiente
   (matching por `data.contactEmail` contra `collectionGroup("feeRounds")`
   con status "pending_review"). PENDIENTE: el usuario debe crear el Workflow
   de "Payment Received" en GHL (Emprende 360) apuntando aquí — no confirmado
   si ya se hizo.

b) "broker_onboarding_form_submitted" — auto-aprovisiona la subcuenta GHL del
   broker clonando el Snapshot vía API de agencia. Deduplica por email
   (`provisionedSubaccounts`, con auditoría).

   >>> ESTE FLUJO YA SE PROBÓ END-TO-END CON EL WORKFLOW REAL DE GHL <<<
   Workflow: "SaaS - Creación de Subcuenta" en la subcuenta "Emprende 360",
   trigger "Form Submitted" en el formulario real
   https://api.leadconnectorhq.com/widget/form/sacDExsiSmi2biBxC5Cu
   ("Schedule your onboarding"). El mapeo de Custom Data que SÍ funciona
   (usando los Query Keys reales del formulario vía el picker de GHL, no
   texto escrito a mano):

   | Key         | Value (merge tag de GHL)                                          |
   |-------------|--------------------------------------------------------------------|
   | eventType   | broker_onboarding_form_submitted (texto fijo)                      |
   | fullName    | {{contact.full_name}}                                               |
   | businessPhone | {{contact.phone}}                                                 |
   | businessEmail | {{contact.email}}                                                 |
   | businessName  | {{contact.business_name}}                                         |
   | businessAddress | {{contact.direction_del_negocio}}                               |
   | businessHours | {{contact.horas_de_trabajo}}                                      |
   | businessWebsite | {{contact.website}}                                             |
   | logoColors  | {{contact.por_favor_colocar_los_enlaces_de_sus_redes_sociales_en_esta_seccion}} (sic — el campo se renombró a "Logo Colors" pero el query key interno nunca se actualizó) |

   Header: `x-webhook-secret` = valor de GHL_WEBHOOK_SECRET.
   NO se mapean los 2 campos de archivo (EIN certificate, logo) — la API de
   creación de subcuentas de GHL no tiene campo para adjuntar archivos.

   ESTADO: el fix de `customData` se acaba de pushear. El usuario debe volver
   a correr la prueba real (llenar el formulario) apuntando la URL del
   Webhook de vuelta a `https://e360-hub.vercel.app/api/webhooks/ghl` (no
   webhook.site) una vez el deploy de Vercel termine. Claude Code se ofreció
   a verificar el resultado leyendo la colección `provisionedSubaccounts` de
   Firestore directamente (tiene acceso de lectura vía Admin SDK).

   IDs de negocio confirmados:
   - Snapshot ID (Master CRM ESP/ENG): EJyCKMtKtnKMTT82L0Hu → GHL_BROKER_SNAPSHOT_ID
   - Location ID "Emprende 360": ZF5DfVEmMfEhmmJBEHjw → GHL_ONBOARDING_FORM_LOCATION_ID
   - Location ID plantilla del snapshot: Y4UHMbA40St5o8m7zWs5 (solo referencia)

   RIESGO NO VERIFICADO: el token de agencia (GHL_AGENCY_API_KEY) necesita el
   scope `locations.write` para poder crear subcuentas — antes solo se usaba
   para *leer* (listar subcuentas). Si falla con 403, es por esto.

--------------------------------------------------------------------------------
7. AGENDAMIENTO CON GHL CALENDARS (Tarea #4 — EN PROGRESO)
--------------------------------------------------------------------------------
Objetivo: reemplazar el modal de "Agendar Cita" de `SoporteSection.tsx`, que
hoy es 100% falso (`setTimeout`, sin backend real, mensaje de confirmación por
Zoom que nunca se envía).

Decisión de negocio del usuario: E360 tiene varios empleados con calendarios
propios — se va a usar **un calendario por departamento/empleado** (no un solo
calendario genérico ni round-robin), replicando la misma estructura que ya
existe en Soporte para teléfono/WhatsApp (Soporte VIP General, Comisiones &
Casos, Taxes & Inmigración, MCA James).

Construido hasta ahora (infraestructura, aún sin conectar a la UI):
- `lib/ghl.ts`: `getGHLCalendars()`, `getGHLCalendarFreeSlots()`,
  `createGHLAppointment()` — SIN PROBAR contra un calendario real todavía, la
  forma exacta de la respuesta de GHL puede necesitar ajuste.
- `GET /api/admin/calendars?locationId=X` (nuevo, admin-only) — lista los
  calendarios de una subcuenta sin tener que buscarlos a mano en GHL. Si no se
  pasa locationId, usa GHL_ONBOARDING_FORM_LOCATION_ID (Emprende 360) por
  default.

PENDIENTE (próximos pasos):
1. Deploy + probar `/api/admin/calendars` para ver qué calendarios ya existen
   hoy en GHL.
2. Mapear cada calendario existente a su departamento/empleado; identificar
   cuáles faltan crear (el usuario los crea manualmente en GHL, Claude Code no
   puede crear calendarios vía API).
3. Conectar cada tipo de cita en SoporteSection.tsx a su Calendar ID
   correspondiente (reemplazar el mock).

--------------------------------------------------------------------------------
8. DEPLOYS YA HECHOS
--------------------------------------------------------------------------------
- Firestore rules y Storage rules desplegadas a producción (proyecto Firebase
  `e360-app`).
- Todo commiteado y pusheado a GitHub: orlinelvir/e360-hub, main.
- Vercel: CRON_SECRET ya agregado por el usuario. GHL_WEBHOOK_SECRET,
  GHL_BROKER_SNAPSHOT_ID, GHL_ONBOARDING_FORM_LOCATION_ID — verificar que
  también estén en Vercel producción, no solo en .env.local.

--------------------------------------------------------------------------------
9. LISTA DE TAREAS — ESTADO ACTUAL
--------------------------------------------------------------------------------
[x] #1 Corregir enrutamiento financiero/seguros/corporativo
[ ] #2 Definir y crear los 5 pipelines por cluster de negocio (bloqueado en
       el usuario)
[x] #3 Flujo de pago + formulario de Reparación de Crédito
[~] #4 Agendamiento real con GHL Calendars — infraestructura lista, falta
       mapear calendarios reales y conectar la UI
[x] #5 Automatización de seguimiento mensual + fee de $10 por ronda
[x] #6 Auto-provisioning de subcuenta GHL desde Snapshot — probado
       end-to-end, con un fix reciente pendiente de re-prueba
[ ] #7 Panel de administración completo fase 2 (cola de failed_sync, vista
       agregada de pipeline, catálogo editable, roster de brokers,
       comisiones reales)

--------------------------------------------------------------------------------
10. COSAS QUE EL USUARIO TODAVÍA DEBE HACER (no son de código)
--------------------------------------------------------------------------------
- Configurar GHL_E360_CORPORATE_LOCATION_ID/API_KEY con valores reales.
- Confirmar que GHL_WEBHOOK_SECRET, GHL_BROKER_SNAPSHOT_ID,
  GHL_ONBOARDING_FORM_LOCATION_ID estén en Vercel (no solo local).
- Verificar que el token de agencia tenga el scope locations.write.
- Regresar la URL del Webhook de auto-provisioning de webhook.site de vuelta
  a la URL real de producción, y repetir la prueba con el formulario real.
- Crear el Workflow de "Payment Received" en GHL si no existe todavía.
- Decidir/crear los 5 pipelines por cluster (Tarea #2).
- Revisar en GHL qué calendarios ya existen por empleado/departamento
  (Tarea #4) y crear los que falten.
================================================================================

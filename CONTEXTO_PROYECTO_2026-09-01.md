================================================================================
              CONTEXTO COMPLETO DEL PROYECTO — E360 HUB
================================================================================
Fecha: 2026-09-01
Este documento REEMPLAZA a CONTEXTO_OPENCODE_2026-08-26.md (ese quedó
desactualizado — mucho de lo que ahí decía "pendiente" ya se implementó,
en parte por Claude Code y en parte por trabajo hecho en otra máquina/sesión,
probablemente OpenCode Go, que se fusionó a este repo vía git).

Objetivo de este documento: que cualquier sesión nueva (Claude Code, OpenCode,
o quien sea) pueda retomar el proyecto sin tener que releer todo el historial
de conversación ni re-descubrir bugs ya conocidos.

--------------------------------------------------------------------------------
1. DOCUMENTOS DE REFERENCIA (léelos si necesitas más profundidad)
--------------------------------------------------------------------------------
- AUDITORIA_2026-08-25.md — auditoría original del código (arquitectura,
  seguridad). Algunos hallazgos ahí ya se resolvieron, ver secciones abajo.
- ESTRATEGIA_GHL_2026-08-25.md — inventario de los 18 servicios y estrategia
  de aprovechamiento de GHL (pipelines, custom fields, workflows, snapshots).
- CONTEXTO_OPENCODE_2026-08-26.md — versión anterior de este documento,
  desactualizada pero con detalle histórico de decisiones (Ej. por qué el
  fee de $10 es recurrente, plataformas compatibles con Credit Repair Cloud).

--------------------------------------------------------------------------------
2. ESTADO DE LA LISTA DE TAREAS ORIGINAL (las 7 de la sesión inicial)
--------------------------------------------------------------------------------
[x] #1 Enrutamiento financiero/seguros/corporativo — completo
[x] #2 Pipelines por cluster de negocio — completo pero FRÁGIL (ver sección 5)
[x] #3 Flujo de pago + formulario de Reparación de Crédito — completo
[~] #4 Agendamiento real con GHL Calendars — EN PROGRESO, ver sección 8
[x] #5 Automatización de seguimiento mensual + fee de $10 — completo
[x] #6 Auto-provisioning de subcuenta GHL desde Snapshot — completo, probado
       end-to-end, con un fix reciente que hay que re-verificar
[x] #7 Panel de administración fase 2 — completo pero con BUGS DE PERMISOS
       reales (ver sección 6)

Más allá de esas 7, en la otra sesión se agregó un sistema completo de
soporte con IA (Gemini) que no estaba en el plan original — ver sección 7.

--------------------------------------------------------------------------------
3. SEGURIDAD Y CALIDAD DE CÓDIGO (base, ya resuelto por Claude Code)
--------------------------------------------------------------------------------
- lib/crypto.ts: falla explícito (throw) si falta ENCRYPTION_SECRET en
  producción — ya no degrada a clave hardcodeada.
- next.config.ts: turbopack.root fijado (evita que Turbopack se confunda por
  archivos huérfanos en la carpeta padre del repo).
- package.json: deploy:rules despliega Firestore Y Storage.
- AVISO: el lint ya NO está en 0 errores/0 warnings — el trabajo nuevo de la
  otra sesión introdujo 6 errores + 23 warnings nuevos (imports sin usar en
  varios componentes admin/support, comillas sin escapar en FAQSection.tsx,
  y `scripts/clean-escapes.js` usa require() que el linter rechaza). No es
  urgente pero hay que limpiarlo eventualmente. Typecheck, tests (6/6) y
  build de producción SÍ pasan limpio con el HEAD actual.

--------------------------------------------------------------------------------
4. ENRUTAMIENTO GHL POR DEPARTAMENTO (#1 — completo)
--------------------------------------------------------------------------------
- Los 18 servicios en app/hub/broker-onboarding/data/services.ts tienen
  `centralDepartment: "financial"|"insurance"|"corporate"` explícito.
- services/submit/route.ts enruta por serviceId real, no por keyword matching
  (ese heurístico solo queda como fallback).
- FIX POSTERIOR (otra sesión, commit e6a1424): si no hay credenciales
  específicas de Seguros configuradas, el sync central cae a las credenciales
  de Financiero — confirmado por el usuario que Financiero y Seguros
  comparten la misma subcuenta central GHL ("E360 Broker (Funding Form
  Submissions)").
- Env vars: GHL_E360_CORPORATE_LOCATION_ID/API_KEY — verificar si ya se
  configuraron con valores reales (pendiente la última vez que se revisó).

--------------------------------------------------------------------------------
5. PIPELINES POR CLUSTER (#2 — completo pero frágil, revisar antes de confiar)
--------------------------------------------------------------------------------
Implementado en lib/ghl.ts: 5 clusters (`fondeo_rapido`, `real_estate`,
`credit_repair`, `seguros`, `corporativo`). Cada uno de los 18 servicios tiene
`pipelineCluster` en el catálogo (types.ts + services.ts).

`createOpportunityInPipeline()` ahora busca el pipeline de la subcuenta del
broker cuyo NOMBRE contenga alguna keyword del cluster (ej. "MCA", "Real
Estate", "Seguro"). Si no encuentra coincidencia, cae silenciosamente al
PRIMER pipeline de la lista — igual que el comportamiento viejo, sin ningún
log que distinga "matcheó por cluster" de "cayó al default".

RIESGOS A VIGILAR (no arreglados todavía):
- Depende 100% de que cada broker haya nombrado su pipeline en GHL con
  palabras reconocibles — no hay IDs estables ni tags.
- `resolvePipelineCluster()` está DUPLICADO casi idéntico en
  app/api/services/submit/route.ts y app/api/admin/cases/route.ts, y
  REIMPLEMENTADO DE FORMA DISTINTA en app/api/admin/metrics/route.ts — riesgo
  de que las 3 clasificaciones diverjan con el tiempo. Deberían unificarse en
  una sola función exportada desde services.ts o lib/ghl.ts.
- Un serviceId no reconocido cae por default a "fondeo_rapido" (cuestionable).
- tests/ghl-webhook.test.ts NO importa la función real `mapGHLStageToHubStatus`
  de route.ts — la reimplementa inline, desactualizada (le faltan ramas). Da
  falsa sensación de cobertura; si se rompe la función real, el test no lo
  detecta. Convendría arreglarlo importando la función real.

--------------------------------------------------------------------------------
6. PANEL DE ADMINISTRACIÓN FASE 2 (#7 — completo con bugs de permisos reales)
--------------------------------------------------------------------------------
AdminPanelSection.tsx ahora organiza 6 pestañas, cada una con su endpoint:

| Pestaña | Endpoint | Qué hace |
|---|---|---|
| Master Feed (Casos) | GET/PATCH /api/admin/cases | Vista agregada de TODOS los clientes de TODOS los brokers, editable (status, notas, comisión) |
| Métricas | GET /api/admin/metrics | Dashboard agregado: volumen, comisiones, salud de sync, distribución por cluster |
| Brokers | GET /api/admin/brokers | Roster de brokers con métricas por broker (solo lectura) |
| Roles | GET/POST /api/admin/roles | Asignar rol a cualquier usuario (9 roles definidos) |
| Cola de Sincronización | GET /api/admin/failed-sync + POST /api/admin/retry-sync | Leads con failed_sync/pending_sync, reintento REAL contra GHL |
| Subcuentas GHL | GET /api/admin/locations | El endpoint viejo, sin cambios, ahora con su propia pestaña |

>>> BUGS DE PERMISOS REALES (no cosméticos, causan 403 en producción) <<<
- La pestaña "Cola de Sincronización" se MUESTRA a `admin` Y `support_agent`,
  pero los endpoints `failed-sync` y `retry-sync` exigen `role === "admin"`
  ESTRICTO — un support_agent verá la pestaña pero todo le fallará con 403.
- El PATCH de `/api/admin/cases` también exige admin estricto, aunque los
  roles "especialistas" (underwriter_mca, specialist_real_estate, etc.)
  tienen el permiso `"edit_cases"` en su definición de rol — no pueden
  editar casos vía API aunque la UI/rol lo sugiere.
- Arreglo pendiente: alinear las verificaciones de rol en los endpoints con
  los permisos reales definidos en ROLE_DEFINITIONS (app/api/admin/roles/route.ts).

OTROS HALLAZGOS:
- `scripts/grant-admin.ts` (el script CLI viejo) quedó efectivamente obsoleto
  para uso diario — ahora se asigna rol admin desde la pestaña "Roles". Sigue
  siendo necesario solo para el "primer" admin si su correo no está en
  `MASTER_ADMIN_EMAILS` (hardcodeado en app/api/admin/roles/route.ts:
  fernando.elvire360@gmail.com, admin@emprende360.biz,
  soporte@emprende360.info, jp@startpoint.biz).
- El catálogo de 18 servicios SIGUE siendo un archivo TypeScript estático
  (services.ts) — el pendiente "catálogo editable sin deploy" NO se resolvió.
- Comisiones: ya NO están hardcodeadas a $1,250 — ahora es 5% del monto
  (piso $250 si no hay monto). Excepción: el flujo de credit-repair-intake
  sigue creando `estimatedCommission: 0` (no calcula nada).
- "Verificar Sync" en Mi Perfil sigue siendo decorativo (`setTimeout`, no
  llama a ningún endpoint real).
- El código QR del enlace de referido es un ícono placeholder, no un QR real.
- Varios fetch de escritura (PATCH cases, POST roles) no mandan
  `Authorization: Bearer` — dependen de la cookie `e360_token`. Funciona por
  el fallback en verifyAuthToken, pero es inconsistente con el resto del
  código que sí manda el header explícito.
- tests/admin-api.test.ts es un test simbólico (solo cuenta que un array
  tenga 9 strings) — no valida ninguna petición HTTP real ni auth.

--------------------------------------------------------------------------------
7. SISTEMA DE SOPORTE CON IA — GEMINI (no estaba en el plan original)
--------------------------------------------------------------------------------
Reemplaza la sección de Soporte que antes tenía el modal de citas 100% falso.

- `lib/ai/gemini.ts`: llama la API REST de Gemini directo (sin SDK), modelo
  `gemini-2.0-flash` con fallback automático a `gemini-1.5-flash`. Responde
  JSON forzado `{answer, suggestEscalation}`. API key solo server-side
  (GEMINI_API_KEY), nunca expuesta al cliente — correcto.
- Contexto: FAQs (Firestore `supportKnowledge` o fallback hardcodeado) +
  catálogo de servicios + referencias de guías (solo títulos, sin contenido
  real) — "prompt-stuffing" plano, sin embeddings/vectorstore.
- Memoria de conversación persistida en Firestore, reenviada completa en cada
  turno SIN límite de truncado — riesgo de costo/latencia creciente en
  conversaciones largas. Sin rate-limiting propio (solo maneja el 429 de
  Gemini) — riesgo de costo si alguien abusa del chat.
- Agendamiento de citas: YA NO es falso. `DepartmentCards.tsx` enlaza
  directo a Calendly (RL MultiServices) y a canales reales (WhatsApp/SMS/tel)
  según departamento — no usa GHL Calendars integrado, es delegación externa.

>>> BUG IMPORTANTE: DOS MODELOS DE DATOS DE TICKETS SIN UNIFICAR <<<
- La UI real que el broker usa (`TicketList`, `TicketDetail`,
  `EscalationModal`) escribe/lee de la colección LEGACY
  `brokers/{uid}/tickets` vía `lib/services/broker-service.ts`.
- Los endpoints nuevos (`/api/support/tickets`, `/api/support/escalate`)
  operan sobre `brokers/{uid}/enhancedTickets` — y NO SON LLAMADOS por
  ningún componente del frontend actual (confirmado por grep).
- Consecuencia: un ticket creado desde el modal de escalamiento NO aparece
  luego en el listado tras recargar — viven en colecciones distintas.
- `TicketDetail.tsx`: el botón "Enviar" respuesta es decorativo (sin
  onClick), y el mensaje de "sistema" es texto hardcodeado ("Mock System
  Response for Beta", literal en el código).
- `FAQSection.tsx` usa un array hardcodeado en el componente, DISTINTO del
  que alimenta al chat IA (Firestore `supportKnowledge`) — dos fuentes de
  FAQ desincronizadas.

- `public/templates/welcome-email-template.html`: plantilla de email de
  bienvenida con merge-fields de GoHighLevel, PERO no está conectada a
  ningún envío automático (no hay SendGrid/Resend/etc. en el proyecto) — es
  para copiar/pegar manualmente en un Workflow de GHL. Tiene placeholders
  sin resolver (enlace de WhatsApp, dominio de producción) que hay que
  reemplazar antes de usarla.

PENDIENTE recomendado: unificar el modelo de tickets (elegir legacy o V2 y
migrar), implementar la respuesta real en TicketDetail, decidir el flujo de
envío del email de bienvenida, agregar rate-limiting al chat IA.

--------------------------------------------------------------------------------
8. FLUJO DE REPARACIÓN DE CRÉDITO (#3 — completo, hecho por Claude Code)
--------------------------------------------------------------------------------
- Fee de $10 recurrente (mismo en onboarding y en cada ronda mensual). Pago:
  https://link.fastpaydirect.com/payment-link/6a8688d6f9c8c807930b9166
- Formulario oficial: https://api.leadconnectorhq.com/widget/form/hXr9MAZMR8AHID3LC5cg
- Plataformas compatibles con Credit Repair Cloud: IdentityIQ, SmartCredit,
  MyFreeScoreNow, MyScoreIQ, PrivacyGuard (MyFreeScoreNow sirve para SSN e
  ITIN; para ITIN usa TOKEN en vez de contraseña).
- Firebase Storage configurado desde cero (deny-all al cliente, todo por
  Admin SDK). POST /api/services/credit-repair-intake cifra credenciales
  sensibles (mismo mecanismo que lib/crypto.ts), sube comprobante, crea el
  lead y sincroniza a GHL.
- Firestore: brokers/{uid}/clients/{clientId}/creditRepairCase/case
  (credenciales cifradas) y .../feeRounds/{roundId} (pending_review/paid).
- CreditRepairIntakeModal.tsx (2 pasos) reemplaza a AdmisionFormModal
  específicamente para "credit-repair".
- NOTA (sección 6): estimatedCommission queda en 0 para este flujo — no
  calcula comisión, inconsistente con el resto del sistema (5% del monto).

--------------------------------------------------------------------------------
9. AUTOMATIZACIÓN MENSUAL DEL FEE (#5 — completo, hecho por Claude Code)
--------------------------------------------------------------------------------
- GET /api/cron/credit-repair-rounds, Vercel Cron diario (vercel.json,
  `0 13 * * *` UTC). Autenticado con CRON_SECRET (confirmado agregado en
  Vercel por el usuario).
- Crea la siguiente ronda ($10, pending_review) cuando pasan 30+ días desde
  la última, hasta un máximo de 12 rondas.
- Estado del fee visible como badge (ámbar/verde) en la tarjeta del cliente
  en "Mis Clientes" — se decidió NO usar un sistema de notificaciones nuevo
  porque la colección `notifications` existe en las reglas pero nadie la lee.

--------------------------------------------------------------------------------
10. WEBHOOKS ENTRANTES DE GHL — /api/webhooks/ghl (completo, extendido)
--------------------------------------------------------------------------------
Ahora soporta autenticación por header `x-webhook-secret` O querystring
`?token=`/`?secret=` (se agregó la segunda vía porque algunos triggers de
Workflow de GHL no permiten configurar headers custom fácilmente — pero es
menos seguro, el token queda en logs/historial de configuración de GHL).

Eventos soportados:

a) **Sync de pipeline (GHL → Hub)** — nuevo, ver sección 5 para el mapeo de
   etapas. >>> IMPORTANTE: solo actualiza el campo `status` (que consume el
   panel de Admin), NO actualiza el campo `stage` que usa la vista del
   broker en "Mis Clientes". El broker dueño del cliente NO ve reflejados
   los cambios de pipeline de GHL en su propio dashboard — solo el admin los
   ve. Esto contradice la promesa de "sync bidireccional en tiempo real"
   para el usuario que más lo necesita. Pendiente: decidir si unificar
   status/stage o documentar por qué coexisten. <<<
   Auditoría: colección `ghlWebhookLogs` (solo para este evento; no registra
   los casos `matched:false`, esos solo van a console.warn).

b) **"payment_received"** (hecho por Claude Code) — marca pagada la ronda de
   fee correspondiente por email. Pendiente confirmar si el Workflow de
   "Payment Received" ya se creó en GHL (Emprende 360).

c) **"broker_onboarding_form_submitted"** (hecho por Claude Code) —
   auto-aprovisiona subcuenta desde Snapshot vía API de agencia.
   >>> YA SE PROBÓ end-to-end con el Workflow real "SaaS - Creación de
   Subcuenta" en GHL. Se encontró y corrigió un bug: GHL anida los campos
   de "Custom Data" del Webhook dentro de un objeto `customData`, no en la
   raíz del JSON — el código ahora lee `body.customData || body`. El
   mapeo de Custom Data que SÍ funciona (verificado con un payload real
   capturado en webhook.site):
   fullName={{contact.full_name}}, businessPhone={{contact.phone}},
   businessEmail={{contact.email}}, businessName={{contact.business_name}},
   businessAddress={{contact.direction_del_negocio}},
   businessHours={{contact.horas_de_trabajo}}, businessWebsite={{contact.website}},
   logoColors={{contact.por_favor_colocar_los_enlaces_de_sus_redes_sociales_en_esta_seccion}}
   (ese último query key es así de raro porque el campo se renombró después
   de crearse y GHL nunca actualiza el key interno).
   PENDIENTE: repetir la prueba real apuntando la URL del Webhook de vuelta
   a producción (no webhook.site) para confirmar el fix, y verificar en
   Firestore la colección `provisionedSubaccounts` que se haya creado el
   registro con locationId real.
   IDs: GHL_BROKER_SNAPSHOT_ID=EJyCKMtKtnKMTT82L0Hu,
   GHL_ONBOARDING_FORM_LOCATION_ID=ZF5DfVEmMfEhmmJBEHjw (Emprende 360).
   RIESGO NO VERIFICADO: el token de agencia necesita scope `locations.write`.

--------------------------------------------------------------------------------
11. AGENDAMIENTO CON GHL CALENDARS (#4 — EN PROGRESO)
--------------------------------------------------------------------------------
NOTA: el mock de citas que esta tarea buscaba reemplazar YA FUE REEMPLAZADO
por la otra sesión (ver sección 7) — pero con Calendly externo, NO con GHL
Calendars integrado. Hay que decidir si esta tarea sigue teniendo sentido tal
como se planteó originalmente, o si se da por resuelta con la solución de
Calendly que ya existe.

Decisión de negocio (si se sigue): un calendario por departamento/empleado
(no round-robin), replicando la estructura de Soporte por teléfono/WhatsApp.

Construido por Claude Code (sin probar contra un calendario real todavía):
- lib/ghl.ts: getGHLCalendars(), getGHLCalendarFreeSlots(), createGHLAppointment()
- GET /api/admin/calendars?locationId=X — lista calendarios de una subcuenta
  (admin-only, default a GHL_ONBOARDING_FORM_LOCATION_ID si no se pasa)

PENDIENTE: confirmar con el usuario si esta tarea sigue siendo necesaria dado
que ya existe Calendly como solución, y si sí, probar /api/admin/calendars
contra la subcuenta real y mapear calendarios existentes.

--------------------------------------------------------------------------------
12. DEPLOYS Y CONFIGURACIÓN — ESTADO ACTUAL
--------------------------------------------------------------------------------
- Firestore rules y Storage rules desplegadas a producción (proyecto
  Firebase `e360-app`) — puede necesitar redeploy si las reglas nuevas de
  esta última tanda (enhancedTickets, supportConversations, supportKnowledge)
  no se desplegaron todavía. VERIFICAR.
- GitHub: orlinelvir/e360-hub, main, hasta commit b4b87fd (incluye todo lo
  de este documento).
- Vercel: CRON_SECRET confirmado agregado por el usuario. Verificar que
  también estén en Vercel (no solo en .env.local): GHL_WEBHOOK_SECRET,
  GHL_BROKER_SNAPSHOT_ID, GHL_ONBOARDING_FORM_LOCATION_ID,
  GHL_E360_CORPORATE_LOCATION_ID/API_KEY, GEMINI_API_KEY.

--------------------------------------------------------------------------------
13. PUNCH LIST CONSOLIDADO — QUÉ ARREGLAR PRIMERO (orden sugerido)
--------------------------------------------------------------------------------
1. Alinear permisos: failed-sync/retry-sync/cases-PATCH exigen admin
   estricto pero la UI los muestra a otros roles → 403 reales en producción.
2. Decidir y unificar el modelo de tickets (legacy vs enhancedTickets) antes
   de que un broker pierda un ticket real.
3. Re-probar el webhook de auto-provisioning en producción (fix de
   customData ya está, falta la prueba real).
4. Confirmar/crear el Workflow de "Payment Received" en GHL si no existe.
5. Decidir sobre status vs stage en el sync bidireccional de pipeline.
6. Limpiar los 6 errores + 23 warnings nuevos de eslint.
7. Catálogo de servicios editable sin deploy — sigue sin resolverse.
8. Confirmar scope locations.write del token de agencia.
================================================================================

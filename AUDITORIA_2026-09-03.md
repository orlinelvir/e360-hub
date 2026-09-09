================================================================================
     AUDITORÍA E360 HUB — POR ÁREA DE NEGOCIO (Administrativo, Ventas,
                    Onboarding, Marketing, Soporte)
================================================================================
Fecha: 2026-09-03
Reemplaza como "estado actual" a CONTEXTO_PROYECTO_2026-09-01.md para todo lo
que ese documento marcaba como pendiente y ya se resolvió en esta sesión.
AUDITORIA_2026-08-25.md y ESTRATEGIA_GHL_2026-08-25.md siguen vigentes como
referencia de arquitectura/estrategia original, no se repite ese contenido aquí.

Todos los hallazgos de este documento fueron verificados leyendo el código
real (no de memoria) el día de hoy: lint completo, grep de funciones
específicas, y lectura de archivos — no son suposiciones.

--------------------------------------------------------------------------------
RESUMEN EJECUTIVO
--------------------------------------------------------------------------------
Esta sesión construyó (todo verificado con typecheck + lint + build limpios):
- Gate de verificación obligatorio en admisión de Financiamiento (formulario
  oficial de E360 o PDF de la subcuenta del broker — uno de los 2, si no,
  bloqueado).
- Centro de notificaciones in-app (campanita) para brokers y staff.
- Rastreador de etapa de onboarding de brokers nuevos + verificación
  automática del pago de $750 (lee el tag real de GHL) + mensajería para
  compartir el enlace de agenda vigente.
- Sistema de tickets rediseñado: 8 categorías reales (antes 4 genéricas),
  cliente vinculado, campo condicional por categoría, adjuntos, y
  auto-notificación al rol correcto.
- Catálogo de videos de e360library.com para el Chat IA (curado, con
  enlaces reales de Fathom).
- 2 nuevos administradores agregados (Elian, Mario).

Pero al verificar el resto del sistema para este documento aparecieron 2
hallazgos reales que no estaban documentados en ninguna auditoría anterior
(ver secciones 1 y 2) — ambos de bajo esfuerzo para arreglar.

--------------------------------------------------------------------------------
1. ADMINISTRATIVO (Torre de Control, roles, permisos, comisiones)
--------------------------------------------------------------------------------

DESCARTADO por el usuario (2026-09-03): el punto sobre
GHL_E360_CORPORATE_LOCATION_ID/API_KEY sin configurar NO es un problema real
— el manejo de esas aplicaciones (LLC, Taxes, Inmigración, Payroll, POS) no
depende de ese sync central como se asumió. No se toca.

>>> HALLAZGO NUEVO — Colección "notifications" DUPLICADA en firestore.rules <<<
Hay 2 bloques de reglas distintos para "notifications":
- Línea ~25: `brokers/{userId}/notifications/{notificationId}` — el sistema
  REAL que construimos esta sesión (deny-all, todo por Admin SDK).
- Línea ~113: `/notifications/{notifId}` a nivel raíz, esperando un campo
  `recipientId` — este es un remanente de un diseño anterior que, según
  CONTEXTO_PROYECTO_2026-09-01.md, "existe en las reglas pero nadie la lee".
  Sigue sin ser usado por ningún código actual.
ACCIÓN: borrar el bloque de la línea ~113 (huérfano, y puede confundir a
cualquiera que lea firestore.rules pensando que ese es el sistema activo).

OTROS PENDIENTES YA CONOCIDOS, SIGUEN SIN RESOLVER:
- "Verificar Sync" en Mi Perfil (`MiPerfilSection.tsx:187-193`) sigue siendo
  100% decorativo: un `setTimeout` que SIEMPRE dice "Conexión verificada",
  sin importar si las credenciales realmente sirven. Ya existe un endpoint
  real (`/api/ghl/validate`) usado en el wizard de onboarding — solo falta
  conectarlo aquí también. Un broker con credenciales rotas nunca se entera.
- El enlace de referido usa un dominio hardcodeado (`https://e360hub.com/b/...`,
  `MiPerfilSection.tsx:196,204`) que no coincide con `NEXT_PUBLIC_APP_URL`
  (el que sí usan los correos de Resend). Si "e360hub.com" no es el dominio
  real registrado, todo broker está compartiendo un enlace roto.
- El código QR del enlace de referido sigue siendo un ícono placeholder
  (`MiPerfilSection.tsx:462`, comentario literal "QR Code Placeholder
  vector"), no un QR real generado a partir del enlace.
- Catálogo de 18 servicios (`services.ts`) sigue siendo un archivo estático
  — cambiar precios/requisitos/comisión requiere deploy, no hay editor en
  el panel de admin.
- `credit-repair-intake/route.ts:89`: `estimatedCommission: 0` fijo, nunca
  calcula el 5% como el resto de los servicios.
- Lint: 4 errores persistentes desde hace varias sesiones (2 comillas sin
  escapar en `FAQSection.tsx:95`, 2 `require()` en `scripts/clean-escapes.js`)
  + 13 warnings de imports sin usar. Cosmético, pero nunca se limpió.
- Revisión de seguridad formal — sigue sin hacerse, y la superficie creció
  bastante esta sesión (adjuntos de archivos en 3 flujos distintos, lectura
  de tags de contacto en GHL, nuevos permisos de rol).

--------------------------------------------------------------------------------
2. VENTAS (Financiamiento, Seguros, Corporativo — admisión de clientes)
--------------------------------------------------------------------------------
COMPLETO esta sesión:
- Gate obligatorio: sin formulario oficial confirmado O PDF adjunto, la
  admisión de un servicio de Financiamiento queda bloqueada (cliente Y
  servidor). Motivado por un caso real (Vanessa/Maria Guadalupe Cruz) donde
  se admitió un cliente sin ninguna de las 2 pruebas.

PENDIENTE — el más antiguo de la lista (van 3 veces que se pospone):
- Adjuntar o reemplazar el PDF de la solicitud en un CASO QUE YA EXISTE. Hoy
  el campo de adjunto solo existe en el formulario de admisión inicial — si
  un broker necesita corregir un caso después de creado (como el de
  Vanessa), no tiene forma de hacerlo él mismo, un empleado tiene que
  subirlo por él desde el panel de admin.

RESUELTO (decisión de negocio, no requirió código):
- Los workflows de GHL "Application approved"/"denied" se quedan tal cual
  (solo le avisan al cliente, sin overlap con nuestros correos que son
  broker-only). "APPLICATION SUBMITTED" se recomendó apagar solo el paso de
  Email (dejar el Internal Notification) ya que el tag que lo dispara se
  aplica manualmente y ahora toda solicitud real pasa por el Hub, que ya
  manda su propio correo de bienvenida al momento exacto de la admisión.
  Acción pendiente del lado del usuario dentro de GHL, no en este repo.

SIGUE SIN CONFIRMAR:
- Si `member.identityiq.com` y `www.identityiq.com` (2 URLs distintas vistas
  en distintos mensajes/documentos) son intercambiables o una está obsoleta.

--------------------------------------------------------------------------------
3. ONBOARDING (brokers nuevos)
--------------------------------------------------------------------------------
COMPLETO esta sesión:
- Rastreador de etapa (Ventas → Onboarding Básico → Onboarding CRM → Redes
  Sociales → Completado), avanzado manualmente por el staff.
- Verificación automática del pago del paquete de $750: busca al broker por
  email en la subcuenta de Emprende 360 y revisa el tag real
  `payment completed (spanish)` — sin necesidad de configuración nueva.
- Botón de "Enviar Mensaje" para compartir el enlace de agenda vigente
  (los enlaces de GHL cambian cada vez, así que no se pre-cablearon URLs
  fijas) — sale por correo y por notificación in-app.

SIN PENDIENTES NUEVOS IDENTIFICADOS. Vale la pena, una vez que Laura (o
quien maneje onboarding) lo use un par de semanas, preguntar si el flujo
100% manual de avance de etapa es cómodo en la práctica o si hace falta
algo automático más adelante.

--------------------------------------------------------------------------------
4. MARKETING (Samantha)
--------------------------------------------------------------------------------
Esta es el área con menos construido específicamente para su flujo de
trabajo. Lo que existe hoy:
- Categoría de ticket "Marketing y Contenido" (nueva esta sesión) para que
  brokers pidan ayuda y le llegue notificado.
- Aparece en Contacto Directo con su teléfono/horario real.
- La etapa "Redes Sociales" del onboarding (entrega de contenido, solo 1
  semana) ahora es visible/rastreable vía el Roster de Brokers.

No hay ningún hallazgo de "algo roto" aquí — simplemente no se ha construido
nada MÁS allá de lo anterior. Vale la pena preguntarle directamente a
Samantha si necesita algo del Hub (ej. un checklist de qué contenido se
entregó esa semana, en vez de coordinarlo por fuera).

--------------------------------------------------------------------------------
5. SOPORTE
--------------------------------------------------------------------------------
COMPLETO esta sesión:
- Sistema de tickets: 8 categorías reales (antes 4 genéricas), cliente
  relacionado vinculable, campo condicional por categoría (ej. monto en
  disputa, mensaje de error), adjuntos (imagen/PDF, 8MB), auto-notificación
  al rol de staff correcto en vez de una sola bandeja genérica.
- Centro de notificaciones in-app compartido entre broker y staff.

PENDIENTES YA CONOCIDOS, SIGUEN SIN RESOLVER (de sesiones anteriores):
- Chat IA (Gemini): sin rate-limiting propio — solo maneja el 429 que
  Gemini ya devuelve. Riesgo de costo si alguien abusa del chat.
- Memoria de conversación del chat IA se reenvía completa en cada turno sin
  truncar — riesgo de costo/latencia creciente en conversaciones largas.

--------------------------------------------------------------------------------
6. AUTO-PROVISIONING DE SUBCUENTAS (webhook broker_onboarding_form_submitted)
--------------------------------------------------------------------------------
>>> CONFIRMADO CON DATOS REALES (2026-09-03): NUNCA HA FUNCIONADO <<<
Se corrió un script de diagnóstico directo contra Firestore de producción
(`scripts/diagnose-onboarding-webhook.ts`): la colección
`provisionedSubaccounts` está completamente VACÍA (nunca se ha creado una
subcuenta automáticamente) y `ghlWebhookLogs` también está vacía (ningún
evento de webhook, de ningún tipo, ha quedado registrado jamás). Esto
confirma el reporte del usuario: alguien llena el formulario de onboarding
CRM y no pasa nada, causando atrasos reales en la entrega de acceso al CRM.

Como no hay ningún rastro, no se puede saber todavía si la causa es: (a) el
Workflow de GHL nunca llama a nuestro webhook, (b) lo llama pero el secreto
no coincide (401 silencioso), (c) llega pero el `eventType` no matchea el
string esperado, o (d) llega y falla en la llamada a la API de GHL.

ARREGLADO EN CÓDIGO (esta sesión): el webhook ahora registra en
`ghlWebhookLogs` CADA solicitud recibida (matchee o no, éxito o error),
incluyendo las keys reales del payload recibido — la próxima vez que
alguien llene el formulario, vamos a poder ver exactamente qué mandó GHL en
vez de adivinar. También se agregó notificación automática al staff con rol
`onboarding_member`/`admin` cuando SÍ se aprovisiona exitosamente, para
saber quién necesita entrega de CRM en 24-48h — resuelve el segundo pedido
del usuario (que Samantha se entere).
PENDIENTE: que alguien llene el formulario de prueba de nuevo para generar
el primer log real y diagnosticar la causa raíz definitiva. Si Samantha
necesita ver esta notificación, su cuenta del Hub debe tener el rol
`onboarding_member` asignado (revisar en "Equipo & Roles").

--------------------------------------------------------------------------------
PUNCH LIST CONSOLIDADO — ORDEN SUGERIDO
--------------------------------------------------------------------------------
1. Volver a llenar el formulario de onboarding CRM de prueba y revisar
   `ghlWebhookLogs` para diagnosticar la causa raíz del auto-provisioning
   (sección 6) — ahora sí va a quedar rastro.
2. Adjuntar/reemplazar documento en un caso YA EXISTENTE (Vanessa) — el más
   antiguo pendiente, impacto directo en un caso real.
3. Conectar "Verificar Sync" al endpoint real /api/ghl/validate (ya existe,
   solo falta usarlo) — hoy miente si las credenciales están rotas.
4. Confirmar el dominio real del enlace de referido (hoy dice
   "e360hub.com", posiblemente incorrecto) y generar el QR real.
5. Borrar el bloque huérfano de "notifications" en firestore.rules (línea
   ~113) para evitar confusión futura.
6. Apagar el paso "Email" del workflow "APPLICATION SUBMITTED" en GHL
   (acción del usuario, no de código).
7. Confirmar member.identityiq.com vs www.identityiq.com.
8. Catálogo de servicios editable sin deploy.
9. Calcular comisión real (5%) en credit-repair-intake en vez de $0 fijo.
10. Limpiar los 4 errores + 13 warnings de lint persistentes.
11. Rate-limiting + truncado de memoria en el Chat IA.
12. Revisión de seguridad formal.
================================================================================

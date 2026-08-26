# Auditoría Completa — E360 Hub
**Fecha:** 2026-08-25
**Objetivo:** Mapa completo del estado real del código para planificar la integración de **Credit Repair Cloud (CRC)** y **Make.com**, mientras OpenCode Go está limitado.

> Este documento se generó leyendo línea por línea los 55 archivos de código del proyecto (~8,900 líneas): toda la capa `app/api/*`, `lib/*`, `app/hub/broker-onboarding/*`, las páginas públicas de marketing, y la capa de seguridad/config (`proxy.ts`, `firestore.rules`, CI, env vars).

---

## 1. Qué es este proyecto, en una frase

**E360 Hub** es una plataforma Next.js 16 + Firebase donde **brokers independientes** venden servicios financieros (crédito empresarial, funding/MCA, reparación de crédito, incorporación de empresas, seguros) y gestionan sus leads en un CRM propio construido sobre **GoHighLevel (GHL)**, con doble sincronización automática hacia su propia subcuenta GHL y hacia una subcuenta central de E360.

Hay **dos capas separadas**:
- **Sitio público de marketing** (`/`, `/credit-repair`, `/funding`, `/incorporation`, `/crm`, `/live-training`): 100% brochure, sin ningún formulario conectado a nada. Todo CTA lleva a `/hub/broker-onboarding`.
- **El Hub real** (`/hub/broker-onboarding`): SPA con login, catálogo de 18 servicios, pipeline de clientes tipo kanban, wizard de conexión GHL, soporte, perfil. Aquí vive toda la lógica de negocio real.

---

## 2. Arquitectura actual (lo que YA funciona de punta a punta)

```
Broker se registra (Firebase Auth)
   → Conecta su subcuenta GHL (Location ID + Token PIT) vía Wizard
      → Token se cifra (AES-256-GCM) y se guarda en Firestore (brokers/{uid})
         → Broker admite un cliente (AdmisionFormModal → POST /api/services/submit)
            → Lead se guarda en Firestore (brokers/{uid}/clients, status: pending_sync)
            → Destino A: crea contacto + oportunidad en el GHL del BROKER
            → Destino B: crea contacto + oportunidad en el GHL CENTRAL de E360
                (Financiero o Seguros, decidido por palabras clave en el nombre del servicio)
                + inyecta campos de atribución (E360_Broker_ID/Name/Email)
            → status final: "synced" o "failed_sync"
```

Este flujo (**"Hub-First Intake"**) es exactamente lo que describía tu `roadmap_trabajo_mañana.txt` del 2026-07-25, y **está implementado y funcionando**, con seguridad razonable: JWT verificado con firma real (Firebase Admin), aislamiento multi-tenant verificado (`FORBIDDEN_LOCATION_ACCESS` — un broker no puede leer la subcuenta de otro), y reglas de Firestore coherentes con los roles reales.

---

## 3. Inventario de endpoints API existentes

| Endpoint | Método | Auth | Rate limit | Qué hace |
|---|---|---|---|---|
| `/api/auth/session` | POST/DELETE | idToken | No | Crea/borra cookie de sesión httpOnly |
| `/api/broker/ghl-credentials` | POST | ✅ | No | Guarda Location ID + API key (cifrada) del broker |
| `/api/ghl/validate` | POST | ✅ | No | Valida credenciales GHL en tiempo real (wizard) |
| `/api/ghl/contacts` | GET/POST | ✅ | ✅ 30/10 min | Lista/crea contactos GHL (con aislamiento de tenant) |
| `/api/ghl/opportunities` | PATCH | ✅ | ❌ | Cambia etapa de oportunidad + sync a Firestore |
| `/api/ghl/pipelines` | GET | ✅ | ✅ | En realidad lista oportunidades, no pipelines (nombre confuso) |
| `/api/services/submit` | POST | ✅ | ❌ | **El endpoint más importante** — admisión con doble sync |
| `/api/admin/locations` | GET | ✅ + role=admin | No | Lista subcuentas GHL de toda la agencia |

**Gap notable:** no existe `GET /api/ghl/pipelines/stages` como ruta HTTP pública (la función `getGHLPipelineStages` existe en `lib/ghl.ts` pero solo se usa server-side) — el frontend no puede mostrar dinámicamente el árbol pipeline→stages.

---

## 4. Estado real del Hub de Brokers (UI) — qué es beta y qué es de a de veras

| Sección | Estado | Detalle |
|---|---|---|
| **Login/registro** | ✅ Producción | Firebase Auth completo, con reset de password |
| **Catálogo de 18 servicios** | ⚠️ Parcial | **8 de 18 servicios no tienen formulario conectado** (`formLink: "Formulario en desarrollo"`), incluyendo **Reparación de Crédito** |
| **Admisión de cliente** (`AdmisionFormModal`) | ✅ Funcional | Llama a `/api/services/submit`, doble sync real |
| **Mis Clientes** (pipeline kanban) | ⚠️ Beta | Banner "Módulo en Desarrollo". Comisión estimada **hardcodeada a $1,250** al sincronizar desde GHL (no calculada). Dos flujos de alta de cliente distintos y no unificados (uno crea oportunidad, otro no) |
| **Soporte** | ⚠️ Beta | El agendamiento de citas es **100% simulado** (`setTimeout`, sin backend real) — el mensaje de "confirmación enviada por Zoom" es falso |
| **Mi Perfil** | ⚠️ Beta | Módulos de cobro de comisiones, bóveda de documentos y QR de referidos están bloqueados como "PRÓXIMAMENTE" (mockup visual). "Verificar Sync GHL" es decorativo |
| **Panel de Admin** (`AdminPanelSection.tsx`) | 🔌 Desconectado | **Completo y funcional en backend, pero sin ningún punto de entrada en la UI** — nadie puede llegar a esta pantalla hoy. Arreglo trivial: agregar tab condicional `if (profile?.role === "admin")` |

---

## 5. Hallazgos de seguridad — priorizados

### 🔴 Crítico — revisar antes de seguir
- **`ENCRYPTION_SECRET`** (usado para cifrar los tokens PIT de GHL de cada broker) tiene un *fallback* en `lib/crypto.ts`: si la variable no está seteada, cae a `FIREBASE_PROJECT_ID` (público) y finalmente a un string **hardcodeado en el código fuente** (`"e360-hub-default-dev-key-change-me"`). Si en Vercel producción falta esta variable, todos los tokens PIT de los brokers quedarían cifrados con una clave adivinable/pública.
  **Acción:** confirma en el dashboard de Vercel que `ENCRYPTION_SECRET` está seteada en producción. Yo no tengo forma de verlo desde aquí.

### 🟡 Importante
- El **rate limiting es en memoria** (`Map` de Node) — en Vercel (serverless, multi-instancia) esto casi no protege nada real. `services/submit` y `opportunities` (PATCH) ni siquiera lo tienen.
- El chequeo de **rol `admin`** solo existe en 1 de 7 rutas, sin un guard reutilizable (`requireRole()`).
- **CI no corre `eslint`** pese a que `.roorules` prohíbe `any` — el linter existe como script pero no se ejecuta en GitHub Actions.
- Cobertura de tests real: **2 casos**, solo de `isRateLimited()`. Nada de autenticación, cifrado, ni aislamiento de tenant está testeado automáticamente.
- Variables usadas en producción (`GHL_AGENCY_API_KEY`, `GHL_AGENCY_ID`) **no están documentadas** en `.env.example`.
- Las credenciales de **GHL para Seguros** (`GHL_E360_INSURANCE_*`) están pendientes de configurar en `.env.local` — hoy cualquier lead de seguros simplemente no sincroniza al CRM central (falla silenciosa, sin romper el flujo).

### 🟢 Bien resuelto
- Verificación JWT con firma real (Firebase Admin), fallback inseguro correctamente cerrado por doble flag (`NODE_ENV=development && ALLOW_UNVERIFIED_JWT=true`).
- Cookies `httpOnly` + `sameSite=strict` + `secure` en producción.
- Aislamiento multi-tenant verificado en `/api/ghl/contacts` (`FORBIDDEN_LOCATION_ACCESS`).
- Secretos nunca han estado en git (confirmado con `git log --all`).
- `firestore.rules` coherentes con los roles reales (`broker`/`admin`).

---

## 6. Cómo integrar Credit Repair Cloud (CRC) — plan concreto

**Hoy no hay absolutamente nada de CRC en el código** (cero menciones). Pero el servicio "Reparación de Crédito" ya existe conceptualmente en 3 lugares:
1. `app/credit-repair/CreditRepairClient.tsx` — landing pública con 3 niveles de precio ya definidos (Nivel 1 $250+$50/mes, Nivel 2 $500+$50/mes "más solicitado", Nivel 3 $1,000-2,000+$50/mes) — **útil para mapear el catálogo de servicios de CRC**, pero sin ningún botón conectado.
2. `app/hub/broker-onboarding/data/services.ts` — servicio `credit-repair` con comisión "100% del pago de inicio + $50/mes", pero `formLink: "Formulario en desarrollo"` (bloqueado).
3. `app/api/services/submit/route.ts` — el matching financiero/seguros hoy es por palabra clave y **"credit" hace que Reparación de Crédito caiga erróneamente en la categoría "financiero"** en vez de tener su propia categoría.

**Pasos recomendados (siguiendo el mismo patrón que ya usa GHL):**
1. Crear `lib/credit-repair-cloud.ts` — cliente HTTP puro (sin leer `process.env` directo, recibe `apiKey` por parámetro), calcado de `lib/ghl.ts`: `createCRCClient()`, `getCRCClientStatus()`, etc. (según lo que exponga la API de CRC).
2. Añadir `CRC_API_KEY` / `CRC_BASE_URL` a `.env.example` y `.env.local`.
3. En `app/api/services/submit/route.ts`: corregir el matching (usar `serviceId === "credit-repair"` explícito, no keyword) y agregar un **"Destino C"** que cree el cliente en CRC en paralelo a los destinos A/B existentes, guardando `crcClientId` en el doc de Firestore.
4. Extender `ClientLead`/`ClientLeadData` (hay inconsistencia entre `types.ts` y `broker-service.ts` — conviene unificar esos dos tipos de una vez) con campo `crcClientId`/`crcStatus`.
5. En UI: mostrar estado de disputas/score en `MisClientesSection.tsx` (ficha de detalle) y desbloquear el `formLink` de `credit-repair` en `data/services.ts`.
6. Conectar por fin los botones "Iniciar este Plan" / "Agendar Auditoría Gratis" de `app/credit-repair/CreditRepairClient.tsx` — hoy son inertes y ese es tráfico de marketing que se está perdiendo.

## 7. Cómo integrar Make.com — plan concreto

**No existe hoy ningún webhook saliente ni entrante.** Puntos de enganche de menor fricción:

1. **Webhook saliente al completar admisión**: en `app/api/services/submit/route.ts`, justo después de `leadRef.update(...)`, agregar un `fetch(process.env.MAKE_WEBHOOK_URL, {...})` con el payload completo (leadId, status, IDs de GHL, broker). Dispara desde ahí cualquier escenario: notificar Slack, actualizar spreadsheet, iniciar onboarding en CRC.
2. **Webhook saliente al cambiar etapa**: mismo patrón en `app/api/ghl/opportunities/route.ts` (PATCH) — útil para automatizar pagos/notificaciones cuando una oportunidad pasa a `approved`/`paid`.
3. **Reemplazar el agendamiento simulado de `SoporteSection.tsx`**: hoy es un mock total (`setTimeout`, mensaje falso de "confirmación por Zoom"). Es el candidato ideal para un escenario real de Make.com que cree el evento en GHL Calendar + notifique por Slack/email.
4. **Webhook entrante** (no existe hoy, hay que crearlo): `app/api/webhooks/make/route.ts` — necesitas un mecanismo de autenticación por firma (HMAC o secreto estático en header), porque `verifyAuthToken` (Firebase) no aplica a llamadas externas de Make.com. Los códigos de error estructurados que ya usan `contacts`/`opportunities`/`pipelines` (`{data, error, code}`) son un buen formato para que Make.com los parseé y ramifique — conviene extender ese mismo formato a `services/submit`, que hoy no lo usa.
5. Las reglas de Firestore ya tienen un comentario ("procesos automáticos (Make.com) escriben KPIs") apuntando a colecciones `kpis`/`leads` que **existen en `firestore.rules` pero nunca se usan en código** — hay que decidir si se activan formalmente para Make.com o se eliminan.

---

## 8. Lista priorizada para mañana

**Seguridad (hacer primero, es rápido):**
- [ ] Confirmar `ENCRYPTION_SECRET` en Vercel producción
- [ ] Agregar `GHL_AGENCY_API_KEY`, `GHL_AGENCY_ID` a `.env.example`
- [ ] Agregar `eslint` al pipeline de CI

**Cablear lo que ya existe pero está desconectado (gran ROI, poco esfuerzo):**
- [ ] Exponer `AdminPanelSection.tsx` en la UI (agregar tab condicional por rol)
- [ ] Unificar los dos tipos de `stage` (`types.ts` vs `broker-service.ts`)
- [ ] Corregir el matching financiero/seguros para que "credit repair" no caiga en "financiero"

**Integración Credit Repair Cloud:**
- [ ] Crear `lib/credit-repair-cloud.ts` siguiendo el patrón de `lib/ghl.ts`
- [ ] Agregar "Destino C" en `services/submit/route.ts`
- [ ] Desbloquear formulario de Reparación de Crédito en el catálogo

**Integración Make.com:**
- [ ] Definir `MAKE_WEBHOOK_URL` / `MAKE_WEBHOOK_SECRET`
- [ ] Agregar webhook saliente en `services/submit` y `ghl/opportunities`
- [ ] Reemplazar el agendamiento simulado de `SoporteSection.tsx` con un escenario real

---

## 9. Notas adicionales de la auditoría de páginas públicas

Ningún formulario del sitio de marketing (`/`, `/credit-repair`, `/funding`, `/incorporation`, `/crm`, `/live-training`) envía datos a ningún lado — todos los CTA de "Aplicar/Solicitar/Agendar/Iniciar Plan" son botones sin `onClick` o anclas de scroll. El único flujo de conversión real es "Ser Broker"/"Login Portal" → `/hub/broker-onboarding`. Esto no bloquea la integración de CRC/Make.com (que vive en el backend del Hub), pero es una brecha de negocio: hay tráfico de marketing con precios ya definidos (ej. `/credit-repair`) que se pierde por completo hoy.

También placeholders menores a limpiar cuando haya tiempo: enlaces de redes sociales y Términos/Privacidad en el Footer (`href="#"`), testimonios con fotos de `randomuser.me`, y las carpetas `data/`, `components/home/`, `components/shared/` que están vacías.

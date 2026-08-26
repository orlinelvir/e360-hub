# Estrategia GoHighLevel × E360 Hub — Aprovechamiento completo
**Fecha:** 2026-08-25

> Este documento analiza los 18 servicios del catálogo de E360, lo que hoy se aprovecha de GoHighLevel (GHL), lo que se está dejando sobre la mesa, y cómo organizar todo — incluyendo si conviene invertir en un panel de administración.

---

## 1. Inventario completo de los 18 servicios

| Servicio | Categoría hoy | Estado | Comisión | ¿Formulario conectado? | Bucket GHL central actual |
|---|---|---|---|---|---|
| Préstamo de Negocio (MCA, <680 FICO) | Financiero | Activo | 3–8% del monto | ✅ Widget GHL | Financiero |
| Préstamo Empresarial Convencional (>700) | Financiero | Activo | 2–5% del monto | ✅ Widget GHL | Financiero |
| Préstamo Personal | Financiero | Activo | Honorario fijo | ✅ Widget GHL | Financiero |
| Tarjetas de Crédito de Negocio | Financiero | Activo | Fija s/volumen | ✅ Widget GHL | Financiero |
| Préstamo Hipotecario / Bienes Raíces | Financiero | Activo | Puntos de originación | ✅ Widget GHL | Financiero |
| **Reparación de Crédito** | Financiero | Activo | 100% setup + $50/mes | ❌ Sin formulario | Financiero *(por la palabra "crédito")* |
| **Registro de Compañía (Incorporation)** | Financiero | Activo | $150 fijo | ❌ Sin formulario | ⚠️ Seguros *(no matchea ningún keyword)* |
| Servicios de Nómina (Payroll) | Financiero | Próximamente | Activación + residual | ❌ Sin formulario | ⚠️ Seguros *(no matchea)* |
| Servicios de POS | Financiero | Próximamente | Bono + residual | ❌ Sin formulario | ⚠️ Seguros *(no matchea)* |
| Seguro de Auto Personal | Profesional | Activo | Prima o referido | ✅ Widget GHL | Seguros |
| Seguro Comercial Auto & Trucking | Profesional | Activo | Prima comercial | ✅ Widget GHL | Seguros |
| Seguro de Casa (Homeowners) | Profesional | Activo | Prima anual | ✅ Widget GHL | Seguros |
| Seguro de Negocio (General Liability) | Profesional | Activo | Prima comercial | ✅ Widget GHL | Seguros |
| Seguro de Compensación de Trabajadores | Profesional | Activo | Prima de nómina | ✅ Widget GHL | Seguros |
| **Servicios de Inmigración** | Profesional | Activo | 30% de referido | ❌ Sin formulario | ⚠️ Seguros *(no matchea)* |
| **Preparación de Impuestos** | Profesional | Activo | % s/costo base | ❌ Sin formulario | ⚠️ Seguros *(no matchea)* |
| Seguro de Vida | Profesional | Activo | 80–100% prima año 1 | ❌ Sin formulario | Seguros |
| Membresía de Seguro Médico | Profesional | Activo | Residual mensual | ❌ Sin formulario | Seguros |

**Hallazgos clave de esta tabla:**
- **8 de 18 servicios no tienen formulario conectado** — el broker solo puede usar el modal genérico "Admitir Cliente" (nombre, email, teléfono, monto, notas), que no captura los datos específicos que cada servicio necesita (ver sección 3).
- **5 servicios se enrutan al bucket equivocado** en `app/api/services/submit/route.ts`: el código decide "Financiero vs Seguros" buscando palabras como *loan/credit/crédito/préstamo/fondeo* en el nombre del servicio. "Registro de Compañía", "Nómina", "POS", "Inmigración" y "Preparación de Impuestos" no contienen ninguna de esas palabras, así que caen por defecto en el bucket de **Seguros** — un departamento que no tiene nada que ver con ellos.
- **Solo existen 2 "buckets" centrales de GHL** (Financiero / Seguros), pero el catálogo real tiene al menos **3 líneas de negocio distintas**: Financiamiento, Seguros, y Servicios Corporativos/Legales (incorporación, taxes, inmigración) — que hoy no tienen hogar propio.

---

## 2. Lo que YA se aprovecha de GHL

- **Contactos y Oportunidades vía API v2** (`lib/ghl.ts`): crear/listar contactos, crear/actualizar oportunidades, pipelines.
- **Multi-tenant real**: cada broker conecta su propia subcuenta (Location ID + Token PIT cifrado), aislado de los demás.
- **Atribución automática**: al escribir en el CRM central, se inyectan 3 custom fields (`E360_Broker_ID`, `E360_Broker_Name`, `E360_Broker_Email`) para saber qué broker originó cada lead sin validación manual.
- **10 de 18 servicios** ya tienen un formulario nativo de GHL (LeadConnector widget) embebido como enlace externo.
- **Panel de agencia** (recién cableado): lista todas las subcuentas de brokers vía el token de agencia.

**Lo que esto NO incluye todavía** — y es donde está la oportunidad: Pipelines por línea de negocio, Custom Fields estructurados por servicio, Formularios nativos embebidos con atribución automática, Workflows/Automatizaciones, Calendarios, Cobros/Facturación, Membresías, Snapshots para escalar el onboarding de brokers, y reporting agregado.

---

## 3. Lo que NO se está aprovechando de GHL (oportunidades concretas)

### 3.1 Pipelines por línea de negocio (hoy: 1 solo pipeline genérico por subcuenta)

`createOpportunityInPipeline()` en `services/submit/route.ts` **toma el primer pipeline y la primera etapa que encuentra** — no hay pipelines diferenciados. Pero los 18 servicios tienen ciclos de venta radicalmente distintos:

| Cluster | Servicios | Ciclo típico | Pipeline recomendado |
|---|---|---|---|
| Fondeo Rápido | MCA, Tarjetas de Crédito, Préstamo Personal | 1–14 días | "Fondeo Rápido" (Lead → Docs → Sometido → Aprobado → Fondeado) |
| Bienes Raíces | Hipotecario/DSCR | 5–90 días | "Real Estate" (Lead → Precalificado → Underwriting → Cierre) |
| Reparación de Crédito | Credit Repair | Suscripción 6–12 meses | "Credit Repair" (Onboarding → Disputa Ronda 1/2/3... → Score Mejorado) — con **etapas mensuales**, no lineales |
| Seguros | Auto, Casa, Comercial, Vida, Salud, Workers Comp | 1–7 días | "Seguros" (Cotización → Presentada → Bindeada/Pagada) |
| Servicios Corporativos | Incorporación, Taxes, Inmigración | 1–7 días, basado en documentos | "Corporativo" (Info Recibida → En Preparación → Radicado/Entregado) |
| Próximamente | Payroll, POS | — | Sin pipeline aún (no lanzados) |

Cada broker debería tener estos mismos pipelines clonados en su subcuenta (ver Snapshots, 3.6), y el código de `services/submit` debería elegir el pipeline **por `serviceId` explícito**, no por keyword matching ni "el primero que aparezca".

### 3.2 Custom Fields estructurados — ya tienes el contenido, falta conectarlo

Cada servicio en `data/services.ts` ya tiene un array `requirements` completo (ej. business-loan pide: meses operando, depósitos mensuales, NSF, EIN, voided check...). **Hoy eso es solo texto decorativo** que el broker lee como checklist — no está conectado a ningún campo real de GHL ni a ningún formulario. Esa lista es literalmente la especificación de los custom fields que faltan crear en GHL por servicio (ej. `months_in_business`, `monthly_deposits`, `ein`, `nsf_count`).

### 3.3 Formularios nativos con atribución automática (resuelve el hueco de los 8 servicios sin formulario)

En vez de seguir usando enlaces externos de LeadConnector (que hoy generan el problema de "esta aplicación no aparece en Mis Clientes"), se puede:
- Construir un formulario nativo por servicio dentro del Hub (usando los mismos `requirements` como campos), que llame a `/api/services/submit` extendido con los campos específicos.
- O usar el **GHL Forms Builder** con custom fields por servicio, embebido vía iframe/API, para que la sumisión llegue directo al pipeline correcto con la atribución ya inyectada — cerrando la brecha para los 8 servicios sin formulario (Reparación de Crédito, Incorporación, Nómina, POS, Inmigración, Taxes, Vida, Salud).

### 3.4 Workflows / Automatizaciones — reemplazan cosas que hoy están simuladas o son manuales

- **Reparación de Crédito ya tiene el proceso documentado**: *"Seguimiento mensual (cada 30 días) con el cliente para monitorear eliminaciones"* — esto es literalmente la especificación de un Workflow de GHL con un delay de 30 días que se repite automáticamente, en vez de que el broker tenga que acordarse manualmente.
- **Cambios de etapa automáticos**: hoy el broker mueve manualmente las tarjetas del pipeline (`PATCH /api/ghl/opportunities`). Un Workflow puede mover automáticamente la etapa cuando se recibe un tag o custom field (ej. "documentos recibidos" → mover a "Docs Pendientes").
- **Notificaciones a Ops**: cuando un lead queda en `failed_sync` o pasa X días sin actividad, un Workflow puede alertar a soporte por Slack/email — hoy eso solo se ve en logs de servidor que nadie revisa.
- **Cobro recurrente de Reparación de Crédito** ($50/mes): GHL soporta facturación recurrente nativa — hoy el cobro se describe solo como un paso manual del proceso ("Cobro de honorarios de inicio... cuota mensual").

### 3.5 Calendarios — reemplazan un mock existente

`SoporteSection.tsx` tiene un modal de "Agendar Cita" que hoy es **100% falso** (`setTimeout`, sin backend real, mensaje de confirmación por Zoom que nunca se envía — ya lo señalamos en la auditoría). GHL Calendars resuelve esto de raíz: agenda real, sincronizada, con recordatorios automáticos. Lo mismo aplica al paso obligatorio *"Cita inicial con el Oficial de Préstamos"* del servicio hipotecario, y a la sección de **Live Training** (clases semanales) que hoy es una página estática sin inscripción real.

### 3.6 Snapshots — la pieza que falta para escalar el onboarding de brokers

Cada broker debe configurar su propia subcuenta GHL manualmente. Un **Snapshot** de GHL permite empaquetar la configuración ideal (pipelines de la sección 3.1, custom fields de la 3.2, workflows de la 3.4, calendarios) y clonarla automáticamente en cada subcuenta nueva de broker. Esto también resuelve un problema técnico real que ya detectamos: `createOpportunityInPipeline()` asume "el primer pipeline/primera etapa" porque **no hay garantía de que todas las subcuentas de brokers tengan la misma estructura** — con un Snapshot, sí la habría, y el código podría referenciar pipelines por nombre/clave estable en vez de adivinar el primero de la lista.

### 3.7 Reputación y Membresías — mencionados en marketing pero no implementados

- `/crm` (página de venta del producto CRM) muestra una animación decorativa de "reseñas de Google" — GHL tiene reputation management real que podría activarse de verdad para brokers que lo quieran.
- El home y `/live-training` mencionan un "Portal de Estudiantes" y grabaciones "disponibles en el CRM" — GHL tiene un producto de Membresías/Comunidad que podría alojar esto realmente, en vez de ser una referencia que no apunta a nada concreto hoy.

---

## 4. Cómo organizar todo — recomendación estructural

1. **`data/services.ts` como fuente de verdad ampliada.** Ya es un buen catálogo — extenderlo con metadata de GHL por servicio: `ghlPipelineKey`, `ghlCustomFieldKeys[]`, `centralDepartment`. Así el código deja de adivinar (keyword matching, "primer pipeline") y empieza a leer configuración explícita.
2. **Pasar de 2 a 3 "departamentos" centrales**: Financiero, Seguros, y **Corporativo/Legal** (incorporación, taxes, inmigración) — hoy esos 3 servicios caen sin querer en Seguros.
3. **Corregir el enrutamiento** en `services/submit/route.ts`: usar el `serviceId` explícito (ya existe en `data/services.ts`) en vez de buscar palabras clave en el título del servicio.
4. **Un pipeline por cluster de negocio** (tabla de la sección 3.1), replicado vía Snapshot en cada subcuenta de broker.
5. **Convención de custom fields fija y documentada** — hoy los 3 IDs de atribución están hardcodeados para una sola subcuenta central; si se agrega un tercer departamento (Corporativo) o cambian los custom fields, hay que mantenerlos sincronizados a mano. Vale la pena documentar (o mover a variables de entorno) los IDs por cada subcuenta central.

---

## 5. ¿Se necesita un panel de administración?

**Sí — y el que se cableó hoy (lista de subcuentas de agencia) es solo el punto de partida.** Con 18 servicios, comisiones variables, y múltiples subcuentas de broker, la operación de E360 necesita visibilidad que hoy no existe en ningún lado:

| Necesidad operativa | Estado actual | Qué resolvería un panel de admin real |
|---|---|---|
| Ver leads que fallaron la sincronización con GHL | Solo aparece en logs de servidor (`console.error`), nadie los revisa | Cola de `failed_sync` con reintento manual |
| Ver el pipeline agregado de TODOS los brokers | No existe — cada broker solo ve el suyo | Vista consolidada por servicio/etapa/monto |
| Editar el catálogo de servicios (precios, comisiones, requisitos) | Requiere editar `data/services.ts` en código y hacer deploy | Editor con guardado a base de datos, sin deploy |
| Gestionar brokers (activar, dar de baja, ver conexión GHL) | Solo vía script manual (`grant-admin.ts`) para el rol admin | Roster de brokers con estado de conexión y acciones |
| Comisiones reales (no el placeholder $1,250 que encontramos en la auditoría) | Hardcodeado | Cálculo real por servicio + tracking de pagos |
| Enrutamiento correcto por servicio (los 5 servicios mal enrutados) | Bug silencioso | Configuración visible y corregible sin tocar código |

**Recomendación:** sí vale la pena invertir en esto, pero como una **fase 2** después de cerrar los huecos de datos (formularios faltantes, pipelines por vertical, enrutamiento correcto) — un panel de admin que muestre datos de una integración todavía incompleta solo va a mostrar huecos, no resolverlos.

---

## 6. Priorización sugerida

1. **Corregir el enrutamiento financiero/seguros/corporativo** (bug rápido, alto impacto — hoy 5 servicios van al departamento equivocado).
2. **Definir y crear los 5 pipelines por cluster** en las subcuentas centrales (Fondeo Rápido, Real Estate, Credit Repair, Seguros, Corporativo).
3. **Cerrar el hueco de los 8 servicios sin formulario**, empezando por Reparación de Crédito (ya tiene toda la estructura de precios y proceso documentada, solo falta el formulario/pipeline).
4. **Automatizar el seguimiento mensual de Reparación de Crédito** con un Workflow (ya está especificado en el proceso).
5. **Reemplazar el agendamiento falso** de `SoporteSection.tsx` con GHL Calendars.
6. **Crear el Snapshot** de configuración estándar para nuevas subcuentas de broker.
7. **Panel de admin fase 2**: cola de errores de sync, catálogo editable, comisiones reales, roster de brokers.

¿Por cuál de estos puntos quieres que empecemos primero?

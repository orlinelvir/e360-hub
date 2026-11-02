# Resumen de Sesión y Documentación Técnica — E360 Hub
**Fecha:** 2 de noviembre de 2026  
**Alcance:** Suite Fiscal Taxes 2025/2026 · Oficina Virtual E360 (Feature-Gated) · Tablero Kanban · Portal CRM Obligatorio de Documentos · Gestor de Tareas por Caso · Scripts de WhatsApp de 1 Clic  
**Estado:** 100% Implementado, probado (59/59 tests) y verificado con TypeScript estricto.

---

## 1. Contexto y Objetivos de la Sesión

En esta sesión se abordaron los requerimientos clave derivados de la reunión estratégica (Fathom transcript - Tarea 3), la Guía Oficial de Ventas de Software Fiscal, las capturas del sistema My Office (`/home/fer20_03/Desktop/E360/MyOffice system/`), y la evolución operativa del Hub para los brokers de Emprende 360:

1. **Lanzamiento de Taxes:** Presentar una oferta clara, fidedigna y sin alucinaciones para la temporada fiscal, estructurada en los 3 caminos de compra oficiales y 4 bancos aliados.
2. **Oficina Virtual E360:** Crear un sistema integral para gestión de expedientes fiscales, facturación, comisiones y contratos IRS, protegido bajo un esquema de monetización (*Feature Gating* por suscripción/activación).
3. **Tablero Kanban para Mis Clientes:** Incorporar un flujo visual ágil de oportunidades con arrastrar y soltar, métricas por columna y compatibilidad móvil.
4. **Portal de Admisión y Carga con CRM Obligatorio (#2):** Centralizar la documentación exigiendo estrictamente el uso de los formularios alojados en StartPoint CRM / GoHighLevel (tanto los centrales de E360 como los personalizados con el logo del broker).
5. **Gestor de Tareas y Recordatorios por Caso (#3):** Proveer un checklist con fechas de vencimiento, prioridades e insignias dinámicas en las tarjetas.
6. **Plantillas de WhatsApp de 1 Clic (#4):** Facilitar el contacto inmediato con clientes mediante mensajes dinámicos auto-rellenados que integran el enlace directo al formulario del CRM.

---

## 2. Matriz de Cambios y Archivos Desarrollados

| Módulo / Feature | Descripción Técnica | Archivos Creados o Modificados |
|---|---|---|
| **Landing & Hub Tab Taxes** | Contenido dual (`public` \| `hub`), 3 caminos ($899, $150 + $60/decl, Service Bureau), 4 bancos ($37-$47), política de no reembolso y soporte Fernando. | `app/taxes/page.tsx`, `app/taxes/TaxSoftwareContent.tsx`, `app/hub/broker-onboarding/components/TaxOfficeSection.tsx` |
| **Oficina Virtual Paywall** | Bloqueo comercial con colores institucionales E360 (Cian `#00E0F0` y Azul Marino `#05101F`, sin dorados), botón WhatsApp y demo guiada. | `app/hub/broker-onboarding/components/tax-office/TaxOfficePaywall.tsx` |
| **Oficina Virtual Core** | Dashboard de KPIs, Gestor de Casos (1040, 1120, 1065, ITIN), Invoices, Comisiones (split con deducción de $60 E360 y CSV 1099), Plantillas IRS (Form 7216, Intake, Contrato). | `app/hub/broker-onboarding/components/tax-office/*` (Dashboard, Cases, Invoices, Commissions, Templates, NewTaxCaseModal) |
| **Control Staff Admin** | Switch de activación/desactivación de la Oficina Virtual por broker en Firestore (`BrokerUserProfile.taxOfficeAccess`). | `AdminBrokersTab.tsx`, `app/api/admin/brokers/onboarding/route.ts` |
| **Tablero Kanban** | Arrastrar y soltar nativo (HTML5 Drag & Drop) en 7 etapas, subtotales financieros en vivo por columna, controles móviles `←` `→` y sync con GHL. | `app/hub/broker-onboarding/components/KanbanBoard.tsx`, `app/hub/broker-onboarding/components/MisClientesSection.tsx` |
| **Portal de Documentos CRM (#2)** | Tarjeta de cumplimiento estricto del CRM: exige formularios de StartPoint CRM (centrales E360 o con logo del broker), copia de link y requisitos por vertical. | `app/hub/broker-onboarding/components/crm-tools/CrmDocumentPortalCard.tsx` |
| **Gestor de Tareas por Caso (#3)** | Modelo `CaseTask`, checklist interactivo, prioridades (Alta/Media/Baja), alerta de vencimiento, presets de 1 clic y badges dinámicos en tarjetas. | `app/hub/broker-onboarding/types.ts`, `app/hub/broker-onboarding/components/crm-tools/CaseTasksSection.tsx` |
| **Plantillas WhatsApp 1 Clic (#4)** | Modal con 4 scripts dinámicos (Admisión CRM, Recordatorio Docs, Caso Sometido, Aprobación) con sustitución automática de cliente, broker, servicio y URL de CRM. | `app/hub/broker-onboarding/components/crm-tools/WhatsAppQuickScriptsModal.tsx` |
| **Pruebas Automatizadas** | Suite unitaria que verifica enlaces oficiales de CRM, generación de scripts WhatsApp y consistencia del modelo `CaseTask`. | `tests/crm-tools-and-tasks.test.ts` |

---

## 3. Especificación Detallada por Componente

### 3.1. Oferta Comercial de Software Fiscal y Taxes (`/taxes`)
* **3 Caminos Claros:**
  1. **Software Completo ($899):** Licencia multi-usuario ilimitada (1040, 1120, 1120-S, 1065, W-2, 1099, ITIN) con transmisión electrónica federal y estatal sin límites.
  2. **Curso + Mentoría ($150 + desde $60/retorno):** Capacitación intensiva en vivo para quienes no poseen EFIN propio o desean comenzar sin riesgo. Transmisión bajo el EFIN central de E360 con revisión experta de Fernando.
  3. **Service Bureau / Paquete Multi-Oficina:** Para agencias estructuradas que manejan preparadores dependientes, con cálculo centralizado de splits.
* **Integración Bancaria IRS:**
  * 4 Bancos certificados: **SBTPG, Refund Advantage, Republic Bank, EPS Financial**.
  * Deducción de honorarios directamente del reembolso federal del contribuyente (*Bank Products*). Costo bancario: **\$37 – \$47** por declaración.
  * Adelantos de reembolso al contribuyente (*Refund Advances*) de hasta **\$7,000**.
* **Condiciones Comerciales y Soporte:**
  * **Política Estricta de No Reembolso:** El software digital y sus códigos de autorización IRS no admiten cancelaciones ni devoluciones.
  * **Soporte Directo:** Fernando de Lunes a Viernes de 9:00 AM a 6:00 PM EST. Clases de mentoría en vivo los **Jueves a las 12:00 PM EST**.
  * **Canal Oficial WhatsApp:** `+1 (917) 284-5636`.

---

### 3.2. Oficina Virtual E360 (Tax Office System)
* **Feature Gating por Suscripción:**
  * Si `taxOfficeAccess === false` (por defecto en nuevos brokers), se muestra la pantalla de bloqueo de alta conversión ([`TaxOfficePaywall.tsx`](file:///home/fer20_03/Desktop/E360/E360%20Website/e360-hub-1/app/hub/broker-onboarding/components/tax-office/TaxOfficePaywall.tsx)).
  * Paleta visual oficial E360: **Cian `#00E0F0` / `cyan-400` / `cyan-500` y Azul Marino `#05101F` / `#0A182D`**, erradicando los tonos dorados previos para armonizar con la identidad del Hub.
  * Switch interactivo para alternar libremente entre el modo demostración guiada y la pantalla de bloqueo.
* **Separación de Datos de Producción (Cero Datos Falsos):**
  * Las cuentas reales de los brokers inician estrictamente en estado cero (**\$0 de comisiones y 0 declaraciones**). Los datos de muestra solo se inyectan si el usuario activa el interruptor de demostración guiada (claramente identificado con etiquetas de muestra).
* **Módulos Fiscales Integrados:**
  * **Dashboard:** Tarjetas KPI de volumen, comisiones netas y pipeline del IRS en tiempo real.
  * **Expedientes Fiscales:** Filtrado por formulario (1040 personal, Anexo C independiente, 1120 corporativo, 1065 sociedad, 1040-X enmienda, W-7 ITIN) y visualización detallada de estados IRS (`transmitted`, `accepted`, `in_review`, `docs_pending`).
  * **Facturación (Invoices):** Emisión y control de cobro de honorarios con desglose de métodos de pago (deducción bancaria, tarjeta, Zelle, efectivo).
  * **Comisiones y Splits de Preparadores:** Cálculo automático de porcentajes, descuento del fee de **\$60 de E360** para afiliados bajo mentoría, y exportador CSV listo para el formulario 1099-NEC.
  * **Plantillas IRS Oficiales:** Form 7216 de consentimiento y confidencialidad IRS, Cuestionario Intake 2025 y Acuerdo de Prestación de Servicios Fiscales.
* **Mesa de Ayuda y Administración Staff:**
  * En [`AdminBrokersTab.tsx`](file:///home/fer20_03/Desktop/E360/E360%20Website/e360-hub-1/app/hub/broker-onboarding/components/admin/AdminBrokersTab.tsx), el staff cuenta con un switch de 1 clic para conceder acceso inmediato a la Oficina Virtual a cualquier broker tras confirmar su pago o membresía.

---

### 3.3. Tablero Kanban de Mis Clientes
* **Pipeline de 7 Fases:**
  `lead` (Nuevo Lead) → `qualification` (En Calificación) → `docs_pending` (Docs Pendientes) → `submitted` (Sometido a Banco) → `approved` (Aprobado) → `paid` (Comisión Pagada) → `rejected` (No Aprobado).
* **Arrastrar y Soltar Nativo:** Implementado con eventos estándar HTML5 (`dragstart`, `dragover`, `drop`), garantizando máxima ligereza sin dependencias externas pesadas.
* **Subtotales Financieros en Vivo:** Cada columna calcula al vuelo la suma de los montos solicitados (**Volumen**) y las comisiones estimadas (**Comisión Est.**).
* **Accesibilidad Móvil:** Botones `←` y `→` para mover clientes entre etapas sin necesidad de arrastrar.
* **Sincronización:** Refleja cambios en vivo en StartPoint CRM vía `/api/ghl/opportunities`.

---

### 3.4. Requisito #2: Portal de Documentos con CRM Obligatorio
* **Componente:** [`CrmDocumentPortalCard.tsx`](file:///home/fer20_03/Desktop/E360/E360%20Website/e360-hub-1/app/hub/broker-onboarding/components/crm-tools/CrmDocumentPortalCard.tsx)
* **Regla de Operación:**
  * Se notifica de manera destacada e imperativa que **el uso del CRM es estrictamente necesario en todo momento**.
  * Ninguna admisión ni carga documental es válida por vías informales; debe realizarse a través de:
    1. Los formularios oficiales de Emprende 360 (enlace central).
    2. Los formularios personalizados con el **logo propio del broker** alojados en su subcuenta de StartPoint CRM.
* **Funcionalidades:**
  * Enlace directo al formulario de admisión del servicio correspondiente (ej. MCA, SBA Convencional, Bienes Raíces, Reparación de Crédito).
  * Botón de copiado rápido con feedback visual (*"¡Copiado!"*).
  * Botón directo para abrir el formulario en una pestaña nueva.
  * Acceso directo a la consola del CRM (`https://app.startpoint.biz`).
  * Checklist visual de los documentos requeridos para la vertical en curso (3 meses de estados de cuenta bancarios, identificación oficial, voided check, EIN, etc.).

---

### 3.5. Requisito #3: Gestor de Tareas y Recordatorios por Caso
* **Componente:** [`CaseTasksSection.tsx`](file:///home/fer20_03/Desktop/E360/E360%20Website/e360-hub-1/app/hub/broker-onboarding/components/crm-tools/CaseTasksSection.tsx)
* **Modelo `CaseTask`:**
  ```typescript
  export interface CaseTask {
    id: string;
    clientId: string;
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
    createdAt: string;
  }
  ```
* **Funcionalidades:**
  * Checklist con casillas de verificación para marcar tareas completadas/pendientes.
  * Etiquetas de prioridad con colores: Alta (rojo), Media (cian), Baja (gris).
  * Control de fecha de vencimiento con advertencia visual de **"(Vencida)"** si la fecha expira.
  * **Presets de 1 Clic para agilizar la operación diaria:**
    * *Solicitar 3 meses de Bank Statements de Negocio*
    * *Verificar Formulario Oficial CRM completado*
    * *Solicitar Reporte de Crédito IdentityIQ*
    * *Enviar Acuerdo de Broker / Fee para Firma Digital*
    * *Cargar Copia de ID Oficial Vigente y EIN*
    * *Llamada de Seguimiento de Oferta Aprobada*
* **Insignia en Tarjetas de Clientes:**
  * Tanto en el Tablero Kanban como en la cuadrícula de Mis Clientes, cada tarjeta muestra una insignia con el conteo de tareas pendientes (ej. `2 tareas pend.` o `Tareas listas`).

---

### 3.6. Requisito #4: Plantillas de Mensajes de WhatsApp de 1 Clic
* **Componente:** [`WhatsAppQuickScriptsModal.tsx`](file:///home/fer20_03/Desktop/E360/E360%20Website/e360-hub-1/app/hub/broker-onboarding/components/crm-tools/WhatsAppQuickScriptsModal.tsx)
* **Generación Dinámica de Textos:**
  * Sustituye de forma automática: `{clientName}`, `{brokerName}`, `{serviceName}` y el `{crmFormLink}` oficial.
  * Formatea y sanitiza el número telefónico para la API de WhatsApp (`https://wa.me/{telefono}?text=...`).
* **Los 4 Mensajes Pre-Configurados:**
  1. **Admisión y Carga Oficial de Documentos (Enlace CRM):**
     > *"¡Hola {clientName}! Te saluda {brokerName} de Emprende 360. Para iniciar la tramitación de tu solicitud de {serviceName}, por favor completa tus datos y sube los documentos requeridos directamente en nuestro portal seguro de CRM: {crmFormLink} . El proceso es 100% digital y confidencial. Por favor avísame en cuanto lo envíes para dar seguimiento de inmediato con nuestro equipo. ¡Quedo muy atento!"*
  2. **Recordatorio de Documentos Pendientes:**
     > *"Estimado/a {clientName}, te saluda {brokerName} de Emprende 360. Dando seguimiento a tu expediente de {serviceName}, te comento que aún tenemos documentos pendientes para poder presentar tu caso a evaluación formal. Por favor súbelos a través del portal de tu expediente: {crmFormLink} . Cuanto antes los completemos, más rápido podremos obtener tu oferta. ¡Gracias!"*
  3. **Expediente Sometido a Underwriting / Evaluación:**
     > *"¡Excelentes noticias {clientName}! Te confirmo que tu expediente de {serviceName} está completo y ya fue sometido a revisión con la mesa de underwriting. Te estaré notificando en cuanto tengamos la resolución oficial. ¡Agradezco mucho tu confianza y diligencia!"*
  4. **Aprobación y Coordinación de Cierre / Desembolso:**
     > *"¡Felicidades {clientName}! Tu solicitud para {serviceName} ha sido pre-aprobada exitosamente. Por favor comunícate conmigo a la brevedad para revisar juntos los términos de la oferta y coordinar las firmas finales para el desembolso. Saludos cordiales de parte de {brokerName} y todo el equipo de Emprende 360."*
* **Acceso Inmediato:**
  * Botón directo con ícono de WhatsApp en cada tarjeta del Kanban, en cada tarjeta de la cuadrícula y en la cabecera del expediente del cliente.

---

## 4. Resultados de Verificación y Testing

### 4.1. TypeScript Compiler (`tsc --noEmit`)
* Ejecución: `npm run typecheck`
* Resultado: **0 errores**. Todos los tipos, propiedades e interfaces son 100% compatibles.

### 4.2. Suite de Pruebas Unitarias (`tests/*.test.ts`)
* Ejecución: `npx tsx --test tests/*.test.ts`
* Resultado:
  ```text
  ℹ tests 59
  ℹ suites 0
  ℹ pass 59
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ duration_ms 878.5ms
  ```
  * Se incorporó `tests/crm-tools-and-tasks.test.ts` validando la integridad de las URLs de CRM en los 19 servicios, la sustitución limpia de variables de WhatsApp y la estructura de prioridades del modelo `CaseTask`.

---

## 5. Historial de Commits en Git

```text
e22dbfd feat(hub): implement mandatory CRM intake portal, case tasks manager, and 1-click WhatsApp scripts
52770f6 feat(crm): add interactive Kanban board with drag-and-drop to Mis Clientes
584d045 fix(tax-office): adopt official E360 cyan branding, remove gold accents, and separate real zero-state from demo sample data
```

Para enviar estos cambios al repositorio remoto en GitHub, basta con ejecutar:
```bash
git push origin main
```

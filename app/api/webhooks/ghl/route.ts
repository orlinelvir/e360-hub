import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createGHLLocationFromSnapshot } from "@/lib/ghl";

/**
 * Receptor genérico de webhooks salientes de GHL (Workflows → acción "Webhook").
 * Autenticado por secreto compartido (header x-webhook-secret), no por Firebase Auth,
 * ya que quien llama es el servidor de GHL, no un broker con sesión.
 *
 * Eventos soportados:
 * - "payment_received": marca como pagada la ronda del fee de Reparación de Crédito
 *   que corresponda al contacto (matching por email, ver credit-repair-intake/route.ts).
 * - "broker_onboarding_form_submitted": crea automáticamente la subcuenta GHL del
 *   broker clonando el Snapshot (reemplaza el paso manual de ops), disparado desde
 *   el formulario de Onboarding en la subcuenta "Emprende 360".
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!process.env.GHL_WEBHOOK_SECRET || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    // La acción "Webhook" de los Workflows de GHL anida todo lo que se define en
    // "Custom Data" dentro de un objeto `customData`, no en la raíz del JSON —
    // confirmado inspeccionando un payload real con webhook.site.
    const data = body.customData && typeof body.customData === "object" ? body.customData : body;
    const eventType = String(data.eventType || "");

    if (eventType === "payment_received") {
      const email = String(data.contactEmail || "").trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "contactEmail requerido" }, { status: 400 });
      }

      const snap = await adminDb
        .collectionGroup("feeRounds")
        .where("clientEmail", "==", email)
        .where("status", "==", "pending_review")
        .get();

      if (snap.empty) {
        console.warn("Webhook de pago: no se encontró ronda pendiente para", email);
        return NextResponse.json({ received: true, matched: false });
      }

      // Si hubiera varias rondas pendientes para el mismo email (poco común),
      // se toma la más antigua: es la que corresponde al pago que acaba de llegar.
      const roundDoc = snap.docs.sort((a, b) => String(a.data().createdAt || "").localeCompare(String(b.data().createdAt || "")))[0];

      await roundDoc.ref.update({
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentReference: data.reference || null
      });

      // El cliente (brokers/{uid}/clients/{clientId}) es el doc padre de feeRounds —
      // se refleja ahí también para que la tarjeta en "Mis Clientes" lo muestre sin
      // una lectura extra.
      const clientRef = roundDoc.ref.parent.parent;
      if (clientRef) {
        await clientRef.update({
          feeRoundStatus: "paid",
          feeRoundNumber: roundDoc.data().roundNumber || null
        });
      }

      return NextResponse.json({ received: true, matched: true, roundId: roundDoc.id });
    }

    if (eventType === "broker_onboarding_form_submitted") {
      // Campos tal como los captura el formulario real "Schedule your onboarding"
      // (https://api.leadconnectorhq.com/widget/form/sacDExsiSmi2biBxC5Cu):
      // Nombre Completo (un solo campo), Business Phone/Email/Name/Address/Hours/Website, Logo Colors.
      const fullName = String(data.fullName || "").trim();
      const [firstName, ...restName] = fullName.split(/\s+/).filter(Boolean);
      const lastName = restName.join(" ");

      const email = String(data.businessEmail || "").trim().toLowerCase();
      const phone = String(data.businessPhone || "").trim();
      const businessName = String(data.businessName || "").trim();
      const businessAddress = String(data.businessAddress || "").trim();
      const businessHours = String(data.businessHours || "").trim();
      const businessWebsite = String(data.businessWebsite || "").trim();
      const logoColors = String(data.logoColors || "").trim();

      if (!email || (!fullName && !businessName)) {
        return NextResponse.json({ error: "Faltan datos mínimos (correo y nombre o negocio)" }, { status: 400 });
      }

      const agencyId = process.env.GHL_AGENCY_ID;
      const agencyApiKey = process.env.GHL_AGENCY_API_KEY;
      const snapshotId = process.env.GHL_BROKER_SNAPSHOT_ID;

      if (!agencyId || !agencyApiKey || !snapshotId) {
        console.error("Auto-provisioning: faltan GHL_AGENCY_ID / GHL_AGENCY_API_KEY / GHL_BROKER_SNAPSHOT_ID en el servidor.");
        return NextResponse.json({ error: "Servidor no configurado para auto-aprovisionar subcuentas" }, { status: 500 });
      }

      // Evita duplicar la subcuenta si GHL reintenta la entrega del webhook.
      const existing = await adminDb.collection("provisionedSubaccounts").where("email", "==", email).limit(1).get();
      if (!existing.empty) {
        const doc = existing.docs[0];
        return NextResponse.json({ received: true, alreadyProvisioned: true, locationId: doc.data().locationId });
      }

      const locationName = businessName || fullName || email;

      try {
        // El formulario captura la dirección como un solo texto libre, no separada en
        // ciudad/estado/código postal — se envía tal cual en "address"; GHL/ops puede
        // completar el resto manualmente en la subcuenta si su formulario lo requiere.
        const result = await createGHLLocationFromSnapshot(
          {
            name: locationName,
            companyId: agencyId,
            snapshotId,
            phone: phone || undefined,
            address: businessAddress || undefined,
            country: "US",
            website: businessWebsite || undefined,
            prospectInfo: { firstName, lastName, email }
          },
          agencyApiKey
        );

        const newLocationId = result.id || result.location?.id || null;

        await adminDb.collection("provisionedSubaccounts").add({
          email,
          fullName,
          businessName,
          businessAddress,
          businessHours,
          businessWebsite,
          logoColors,
          phone,
          locationId: newLocationId,
          snapshotId,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ received: true, matched: true, locationId: newLocationId });
      } catch (error) {
        console.error("Error auto-provisionando subcuenta de broker:", error);
        return NextResponse.json({ error: "No se pudo crear la subcuenta automáticamente" }, { status: 502 });
      }
    }

    console.warn("Webhook GHL: eventType no reconocido:", eventType);
    return NextResponse.json({ received: true, matched: false, reason: "unknown_event_type" });
  } catch (error) {
    console.error("Error procesando webhook de GHL:", error);
    return NextResponse.json({ error: "Error al procesar el webhook" }, { status: 500 });
  }
}

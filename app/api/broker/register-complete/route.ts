import { NextResponse, after } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { sendBrokerWelcomeEmail } from "@/lib/email/send";
import { syncBrokerToCentralGHL } from "@/lib/services/broker-ghl-sync";
import { completeBrokerRegistration } from "@/lib/services/broker-registration";

/**
 * Punto de entrada autenticado para "terminar" el registro de un broker —
 * llamado justo después de que el cliente crea su propia cuenta
 * (AuthProvider.tsx), desde los 3 lugares que hoy pueden crear el doc de
 * brokers/{uid}. La lógica real vive en lib/services/broker-registration.ts,
 * compartida con el webhook de "payment_completed" de GHL — ver ese archivo
 * para el porqué (el pago y el registro en el Hub no tienen un orden fijo).
 */
export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const result = await completeBrokerRegistration(user.uid);
    if (!result) {
      return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
    }

    if (result.isNewAssignment) {
      after(() =>
        sendBrokerWelcomeEmail({
          brokerEmail: result.email,
          brokerName: result.displayName,
          brokerId: result.brokerId
        })
      );

      after(() =>
        syncBrokerToCentralGHL({
          brokerName: result.displayName,
          brokerEmail: result.email,
          brokerId: result.brokerId
        })
      );
    }

    return NextResponse.json({ success: true, brokerId: result.brokerId, alreadyRegistered: !result.isNewAssignment });
  } catch (error) {
    console.error("Error en register-complete:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

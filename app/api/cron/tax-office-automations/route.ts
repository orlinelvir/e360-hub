import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getTaxOfficeAccountUids, runTaxAutomationsForBroker } from "@/lib/services/tax-office-service";

/**
 * Cron diario (ver vercel.json) que corre las automatizaciones activas de
 * cada cuenta con Oficina Virtual E360 — recordatorios de deadline, cambios
 * de etapa, tareas vencidas y facturas vencidas. Ver runTaxAutomationsForBroker
 * en lib/services/tax-office-service.ts para la lógica de evaluación.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const uids = await getTaxOfficeAccountUids();
    let totalAutomationsRun = 0;
    let totalActionsFired = 0;

    for (const uid of uids) {
      const { automationsRun, actionsFired } = await runTaxAutomationsForBroker(uid);
      totalAutomationsRun += automationsRun;
      totalActionsFired += actionsFired;
    }

    return NextResponse.json({ success: true, accountsChecked: uids.length, totalAutomationsRun, totalActionsFired });
  } catch (error) {
    console.error("Error corriendo automatizaciones de Oficina Virtual E360:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

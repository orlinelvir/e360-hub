import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const role = adminSnap.exists ? adminSnap.data()?.role : undefined;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de administrador." },
        { status: 403 }
      );
    }

    const brokersSnap = await adminDb.collection("brokers").get();
    let totalBrokers = brokersSnap.size;
    let connectedBrokers = 0;
    let totalLeads = 0;
    let totalVolume = 0;
    let estimatedCommissions = 0;
    let syncedCount = 0;
    let failedSyncCount = 0;

    const clusterStats: Record<string, { count: number; volume: number }> = {
      fondeo_rapido: { count: 0, volume: 0 },
      real_estate: { count: 0, volume: 0 },
      credit_repair: { count: 0, volume: 0 },
      seguros: { count: 0, volume: 0 },
      corporativo: { count: 0, volume: 0 },
    };

    await Promise.all(
      brokersSnap.docs.map(async (bDoc) => {
        const bData = bDoc.data();
        if (bData.ghlConnected || bData.ghlLocationId) {
          connectedBrokers++;
        }

        const clientsSnap = await bDoc.ref.collection("clients").get();
        totalLeads += clientsSnap.size;

        clientsSnap.docs.forEach((cDoc) => {
          const c = cDoc.data();
          const amt = Number(c.amount) || 0;
          const comm = Number(c.estimatedCommission) || (amt > 0 ? Math.round(amt * 0.05) : 250);
          totalVolume += amt;
          estimatedCommissions += comm;

          if (c.status === "synced") syncedCount++;
          else if (c.status === "failed_sync" || c.status === "pending_sync") failedSyncCount++;

          const sId = (c.serviceId || "").toLowerCase();
          const sName = (c.serviceName || "").toLowerCase();

          let cluster = "fondeo_rapido";
          if (sId.includes("mortgage") || sName.includes("real estate") || sName.includes("hipotec")) cluster = "real_estate";
          else if (sId.includes("credit-repair") || sName.includes("reparaci")) cluster = "credit_repair";
          else if (sId.includes("insurance") || sName.includes("seguro")) cluster = "seguros";
          else if (sId.includes("incorporation") || sId.includes("tax") || sId.includes("immigration") || sId.includes("payroll") || sId.includes("pos")) cluster = "corporativo";

          if (clusterStats[cluster]) {
            clusterStats[cluster].count++;
            clusterStats[cluster].volume += amt;
          }
        });
      })
    );

    return NextResponse.json({
      metrics: {
        totalBrokers,
        connectedBrokers,
        totalLeads,
        totalVolume,
        estimatedCommissions,
        syncHealth: {
          synced: syncedCount,
          failed: failedSyncCount
        },
        clusterStats
      }
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

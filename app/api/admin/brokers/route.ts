import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);

    if (!hasPermission(role, "manage_brokers")) {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere permiso para gestionar brokers." },
        { status: 403 }
      );
    }

    const brokersSnap = await adminDb.collection("brokers").get();
    const brokersList = await Promise.all(
      brokersSnap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        const clientsSnap = await docSnap.ref.collection("clients").get();
        let totalVolume = 0;
        let pendingSyncCount = 0;
        
        clientsSnap.docs.forEach((c) => {
          const cData = c.data();
          const amt = Number(cData.amount) || 0;
          totalVolume += amt;
          if (cData.status === "failed_sync" || cData.status === "pending_sync") {
            pendingSyncCount++;
          }
        });

        return {
          uid: docSnap.id,
          displayName: data.displayName || data.name || "Broker sin nombre",
          email: data.email || "",
          phone: data.phone || "",
          tier: data.tier || "Junior Broker",
          role: data.role || "broker",
          ghlConnected: Boolean(data.ghlConnected || data.ghlLocationId),
          ghlLocationId: data.ghlLocationId || "",
          onboardingStage: data.onboardingStage || "ventas",
          packagePaid: Boolean(data.packagePaid),
          createdAt: data.createdAt || "",
          totalClients: clientsSnap.size,
          totalVolume,
          pendingSyncCount,
        };
      })
    );

    return NextResponse.json({ brokers: brokersList, total: brokersList.length });
  } catch (error) {
    console.error("Admin brokers error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

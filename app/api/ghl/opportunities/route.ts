import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { updateGHLOpportunity, CRMError } from "@/lib/ghl";

function mapStageToGHLStatus(stage: string): string {
  if (stage === "approved" || stage === "paid") return "won";
  if (stage === "rejected") return "lost";
  return "open";
}

export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { opportunityId, stage, ghlStatus, pipelineStageId, clientId } = body;

    if (!opportunityId || !stage) {
      return NextResponse.json(
        { error: "opportunityId y stage son requeridos" },
        { status: 400 }
      );
    }

    const { locationId, apiKey } = await resolveBrokerCredentials(user.uid, request);

    if (!locationId || !apiKey) {
      return NextResponse.json(
        { error: "Credenciales CRM no configuradas" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: ghlStatus || mapStageToGHLStatus(stage)
    };
    if (pipelineStageId) {
      updateData.pipelineStageId = pipelineStageId;
    }

    await updateGHLOpportunity(opportunityId, updateData, apiKey);

    if (clientId) {
      const clientRef = adminDb.collection("brokers").doc(user.uid).collection("clients").doc(clientId);
      await clientRef.update({
        stage,
        lastActivity: `Etapa actualizada a '${stage}' - ${new Date().toISOString()}`
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Opportunity update error:", error);
    const status = error instanceof CRMError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status });
  }
}

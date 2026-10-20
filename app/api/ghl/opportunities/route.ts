import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveBrokerCredentials } from "@/lib/resolve-broker-credentials";
import { updateGHLOpportunity, CRMError } from "@/lib/ghl";
import { checkRateLimit } from "@/lib/services/rate-limit-service";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function mapStageToGHLStatus(stage: string): string {
  if (stage === "approved" || stage === "paid") return "won";
  if (stage === "rejected") return "lost";
  return "open";
}

// El broker nunca debe poder empujar un resultado terminal (ganado/perdido)
// directo a GHL — eso dispara el webhook de sincronización bidireccional
// (app/api/webhooks/ghl/route.ts) que escribe el status AUTORITATIVO del
// caso sin que staff lo haya revisado. Aprobar/declinar/fondear es exclusivo
// de /api/admin/cases.
const BROKER_BLOCKED_TERMINAL_STAGES = ["approved", "paid", "rejected"];
const BROKER_BLOCKED_TERMINAL_GHL_STATUSES = ["won", "lost"];

export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(user.uid, "ghl-opportunities-patch", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    const retrySeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
    return NextResponse.json(
      { error: `Demasiadas actualizaciones seguidas. Intenta de nuevo en ${retrySeconds} segundos.` },
      { status: 429 }
    );
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

    if (
      BROKER_BLOCKED_TERMINAL_STAGES.includes(stage) ||
      (ghlStatus && BROKER_BLOCKED_TERMINAL_GHL_STATUSES.includes(String(ghlStatus).toLowerCase()))
    ) {
      return NextResponse.json(
        { error: "Aprobar, declinar o fondear un caso es exclusivo del equipo de staff." },
        { status: 403 }
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

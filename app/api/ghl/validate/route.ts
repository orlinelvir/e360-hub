import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { validateGHLCredentials } from "@/lib/ghl";
import { checkRateLimit } from "@/lib/services/rate-limit-service";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Sin esto, este endpoint es un oráculo para probar pares locationId/apiKey
    // de GHL sin límite — defensa en profundidad además del rate limit propio de GHL.
    const rateLimit = await checkRateLimit(user.uid, "ghl-validate", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      const retrySeconds = Math.ceil((rateLimit.retryAfterMs || 0) / 1000);
      return NextResponse.json(
        { valid: false, error: `Demasiados intentos seguidos. Intenta de nuevo en ${retrySeconds} segundos.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { locationId, apiKey } = body;

    if (!locationId || typeof locationId !== "string") {
      return NextResponse.json(
        { valid: false, error: "Location ID requerido" },
        { status: 400 }
      );
    }
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { valid: false, error: "Token PIT requerido" },
        { status: 400 }
      );
    }

    const result = await validateGHLCredentials(locationId, apiKey);

    console.log("GHL Validation:", {
      uid: user.uid,
      locationId: locationId.substring(0, 8) + "...",
      valid: result.valid,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GHL Validation Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      { valid: false, error: "Error al validar credenciales" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { validateGHLCredentials } from "@/lib/ghl";

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
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
    console.error("GHL Validation Error:", error);
    return NextResponse.json(
      { valid: false, error: "Error al validar credenciales" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getOrCreateBusinessCreditLinkToken } from "@/lib/services/business-credit-intake-service";

/**
 * Devuelve el link público permanente del broker para el formulario de
 * captura del Business Credit Program (DUNS / vendor accounts) — se genera
 * la primera vez que se pide y nunca cambia después.
 */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const token = await getOrCreateBusinessCreditLinkToken(user.uid);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error obteniendo el link del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getBusinessCreditIntakes } from "@/lib/services/business-credit-intake-service";

/** Lista las capturas del Business Credit Program recibidas para este broker. */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const intakes = await getBusinessCreditIntakes(user.uid);
    return NextResponse.json({ intakes });
  } catch (error) {
    console.error("Error listando capturas del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

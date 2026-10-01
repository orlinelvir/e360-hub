import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getFaqs } from "@/lib/ai/knowledge-base";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const faqs = await getFaqs();
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Error obteniendo FAQs:", error);
    return NextResponse.json({ error: "Error al obtener FAQs" }, { status: 500 });
  }
}

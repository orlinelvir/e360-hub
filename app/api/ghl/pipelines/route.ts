import { NextResponse } from "next/server";
import { getGHLOpportunities } from "@/lib/ghl";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId") || undefined;
  const pipelineId = searchParams.get("pipelineId") || undefined;

  try {
    const data = await getGHLOpportunities(locationId, pipelineId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GHL Pipelines API Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al consultar pipeline de GHL" },
      { status: 500 }
    );
  }
}

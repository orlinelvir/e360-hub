import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxPipelines, addTaxPipeline } from "@/lib/services/tax-office-service";
import { NewTaxPipelineInput } from "@/app/hub/broker-onboarding/types";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const pipelines = await getTaxPipelines(user.uid);
  return NextResponse.json({ pipelines });
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const body = (await request.json()) as Partial<NewTaxPipelineInput>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre del pipeline es obligatorio" }, { status: 400 });
  }
  const stageNames = (body.stageNames || []).map((s) => s.trim()).filter(Boolean);
  if (stageNames.length === 0) {
    return NextResponse.json({ error: "Agrega al menos una etapa" }, { status: 400 });
  }

  try {
    const pipeline = await addTaxPipeline(user.uid, { name: body.name.trim(), stageNames });
    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Error creando pipeline fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, getTaxTasks, addTaxTask } from "@/lib/services/tax-office-service";
import { NewTaxTaskInput, TaxTaskPriority } from "@/app/hub/broker-onboarding/types";

const VALID_PRIORITIES: TaxTaskPriority[] = ["low", "medium", "high"];

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const tasks = await getTaxTasks(user.uid);
  return NextResponse.json({ tasks });
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

  const body = (await request.json()) as Partial<NewTaxTaskInput>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "El título de la tarea es obligatorio" }, { status: 400 });
  }

  const input: NewTaxTaskInput = {
    title: body.title.trim(),
    description: body.description?.trim(),
    dueDate: body.dueDate,
    priority: body.priority && VALID_PRIORITIES.includes(body.priority) ? body.priority : "medium",
    relatedClientId: body.relatedClientId
  };

  try {
    const task = await addTaxTask(user.uid, input);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error creando tarea fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

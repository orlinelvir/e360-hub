import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { updateBusinessCreditIntake } from "@/lib/services/business-credit-intake-service";
import { NewBusinessCreditIntakeInput } from "@/app/hub/broker-onboarding/types";

const EDITABLE_FIELDS: (keyof NewBusinessCreditIntakeInput)[] = [
  "ownerFullName",
  "ownerAddress",
  "ownerCity",
  "ownerState",
  "ownerZip",
  "businessLegalName",
  "businessAddress",
  "businessCity",
  "businessState",
  "businessZip",
  "ein",
  "contactEmail",
  "contactPhone"
];

/** Permite al broker corregir un dato que el cliente anotó mal, sin tener que pedirle que llene el formulario otra vez. */
export async function PATCH(request: Request, { params }: { params: Promise<{ intakeId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { intakeId } = await params;
  const body = (await request.json()) as Partial<NewBusinessCreditIntakeInput>;

  const patch: Partial<NewBusinessCreditIntakeInput> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = body[field];
    if (typeof value === "string") patch[field] = value.trim();
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay cambios que guardar" }, { status: 400 });
  }

  try {
    await updateBusinessCreditIntake(user.uid, intakeId, patch);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error actualizando captura del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

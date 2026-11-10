import { NextResponse } from "next/server";
import { getBrokerIdByBusinessCreditToken, submitBusinessCreditIntake } from "@/lib/services/business-credit-intake-service";
import { NewBusinessCreditIntakeInput } from "@/app/hub/broker-onboarding/types";

// Ruta pública (sin autenticación) — el cliente final llena este formulario
// desde el link que le manda su broker. La única credencial es el token
// (128 bits de aleatoriedad), igual que el patrón ya usado en
// /api/tax-forms/[token].

const REQUIRED_FIELDS: (keyof NewBusinessCreditIntakeInput)[] = [
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
  "ein"
];

const MAX_FIELD_LENGTH = 300;

function validateInput(body: Partial<NewBusinessCreditIntakeInput>): string | null {
  for (const field of REQUIRED_FIELDS) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
      return "Faltan campos obligatorios del formulario.";
    }
    if (value.length > MAX_FIELD_LENGTH) {
      return "Uno de los campos es demasiado largo.";
    }
  }
  if (typeof body.contactEmail === "string" && body.contactEmail.length > MAX_FIELD_LENGTH) {
    return "El correo de contacto es demasiado largo.";
  }
  if (typeof body.contactPhone === "string" && body.contactPhone.length > MAX_FIELD_LENGTH) {
    return "El teléfono de contacto es demasiado largo.";
  }
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const brokerId = await getBrokerIdByBusinessCreditToken(token);
  if (!brokerId) {
    return NextResponse.json({ error: "Este link no existe o ya no está disponible" }, { status: 404 });
  }
  return NextResponse.json({ valid: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const brokerId = await getBrokerIdByBusinessCreditToken(token);
  if (!brokerId) {
    return NextResponse.json({ error: "Este link no existe o ya no está disponible" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<NewBusinessCreditIntakeInput>;
  const validationError = validateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const input: NewBusinessCreditIntakeInput = {
      ownerFullName: body.ownerFullName!.trim(),
      ownerAddress: body.ownerAddress!.trim(),
      ownerCity: body.ownerCity!.trim(),
      ownerState: body.ownerState!.trim(),
      ownerZip: body.ownerZip!.trim(),
      businessLegalName: body.businessLegalName!.trim(),
      businessAddress: body.businessAddress!.trim(),
      businessCity: body.businessCity!.trim(),
      businessState: body.businessState!.trim(),
      businessZip: body.businessZip!.trim(),
      ein: body.ein!.trim(),
      contactEmail: body.contactEmail?.trim() || "",
      contactPhone: body.contactPhone?.trim() || ""
    };
    await submitBusinessCreditIntake(brokerId, input);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando captura del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { resolveUserRole } from "@/lib/roles";
import { hasTaxOfficeAccess, updateTaxFormTemplate } from "@/lib/services/tax-office-service";

const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await verifyAuthToken(request);
  if (!user || !adminDb || !adminStorage) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = await resolveUserRole(adminDb, user.uid, user.email);
  if (!(await hasTaxOfficeAccess(user.uid, role))) {
    return NextResponse.json({ error: "Oficina Virtual E360 no está activa para esta cuenta" }, { status: 403 });
  }

  const { formId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "El archivo es requerido" }, { status: 400 });
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return NextResponse.json({ error: "El archivo no puede superar 8MB" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `tax-office-forms/${user.uid}/${formId}/${Date.now()}-${file.name}`;
    await adminStorage.bucket().file(storagePath).save(buffer, { contentType: file.type });

    await updateTaxFormTemplate(user.uid, formId, { attachmentStoragePath: storagePath, attachmentName: file.name });
    return NextResponse.json({ success: true, attachmentName: file.name });
  } catch (error) {
    console.error("Error subiendo adjunto de formulario fiscal:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

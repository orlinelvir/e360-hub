import { NextResponse } from "next/server";
import { verifyAuthToken, adminStorage } from "@/lib/firebase-admin";
import { getBusinessCreditLogoPath, setBusinessCreditLogoPath } from "@/lib/services/business-credit-intake-service";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // la imagen ya viene redimensionada desde el navegador — 2MB es generoso
const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000;

/** Logo que el broker subió para el formulario del Business Credit Program (si tiene uno). */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminStorage) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const storagePath = await getBusinessCreditLogoPath(user.uid);
    if (!storagePath) {
      return NextResponse.json({ url: null });
    }
    const [url] = await adminStorage
      .bucket()
      .file(storagePath)
      .getSignedUrl({ action: "read", expires: Date.now() + SIGNED_URL_EXPIRY_MS });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error obteniendo el logo del Business Credit Program:", error);
    return NextResponse.json({ error: "Error desconocido" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user || !adminStorage) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "El logo es requerido" }, { status: 400 });
  }
  if (file.size > MAX_LOGO_SIZE) {
    return NextResponse.json({ error: "El logo no puede superar 2MB" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Solo se aceptan imágenes JPG o PNG" }, { status: 400 });
  }

  try {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const storagePath = `business-credit-logos/${user.uid}/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await adminStorage.bucket().file(storagePath).save(buffer, { contentType: file.type });
    await setBusinessCreditLogoPath(user.uid, storagePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subiendo el logo del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await setBusinessCreditLogoPath(user.uid, null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error quitando el logo del Business Credit Program:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

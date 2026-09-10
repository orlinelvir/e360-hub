import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { getCaseDocuments, addCaseDocument } from "@/lib/services/case-service";

const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000;

/**
 * Documentos del propio caso del broker (adjuntar o corregir el PDF de la
 * solicitud DESPUÉS de la admisión inicial). Antes esto solo existía en el
 * momento de admitir al cliente — si el broker olvidaba el PDF (como en el
 * caso real que motivó esto), no tenía forma de agregarlo después.
 * brokerId siempre es el propio uid del token, nunca un parámetro — así un
 * broker no puede subir nada al caso de otro.
 */
export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb || !adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
  }

  try {
    const documents = await getCaseDocuments(user.uid, clientId);
    const bucket = adminStorage.bucket();
    const withUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const [url] = await bucket.file(doc.storagePath).getSignedUrl({
            action: "read",
            expires: Date.now() + SIGNED_URL_EXPIRY_MS
          });
          return { ...doc, downloadUrl: url };
        } catch (err) {
          console.error(`No se pudo generar URL firmada para ${doc.storagePath}:`, err);
          return { ...doc, downloadUrl: null };
        }
      })
    );

    return NextResponse.json({ documents: withUrls });
  } catch (error) {
    console.error("Broker case documents GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb || !adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const clientId = String(formData.get("clientId") || "");
    const file = formData.get("file");

    if (!clientId) {
      return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "El archivo es requerido" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar 8MB" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "El archivo debe ser una imagen (JPG/PNG/WEBP) o PDF" }, { status: 400 });
    }

    const clientSnap = await adminDb.collection("brokers").doc(user.uid).collection("clients").doc(clientId).get();
    if (!clientSnap.exists) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const brokerSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const uploadedByName = brokerSnap.data()?.displayName || brokerSnap.data()?.name || user.email || "Broker";

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `case-documents/${user.uid}/${clientId}/${Date.now()}-${file.name}`;
    await adminStorage.bucket().file(storagePath).save(buffer, { contentType: file.type });

    const documentId = await addCaseDocument(user.uid, clientId, {
      fileName: file.name,
      storagePath,
      contentType: file.type,
      size: file.size,
      uploadedByName,
      uploadedById: user.uid
    });

    return NextResponse.json({ success: true, documentId });
  } catch (error) {
    console.error("Broker case documents POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

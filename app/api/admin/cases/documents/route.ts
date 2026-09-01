import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb, adminStorage } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission, getRoleDefinition } from "@/lib/roles";
import { resolvePipelineCluster } from "@/lib/service-routing";
import { getCaseDocuments, addCaseDocument } from "@/lib/services/case-service";

const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000;

async function checkCaseAccess(role: string, brokerId: string, clientId: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  const clientSnap = await adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Caso no encontrado" };

  if (role !== "admin") {
    const client = clientSnap.data()!;
    const cluster = resolvePipelineCluster(client.serviceId, client.serviceName);
    const allowedClusters = getRoleDefinition(role)?.allowedClusters ?? [];
    if (!allowedClusters.includes(cluster)) {
      return { ok: false as const, status: 403, error: "Acceso restringido. Este caso no pertenece a tu vertical asignada." };
    }
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb || !adminStorage) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const brokerId = searchParams.get("brokerId");
  const clientId = searchParams.get("clientId");
  if (!brokerId || !clientId) {
    return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "view_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere rol de empleado o administrador." }, { status: 403 });
    }

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const documents = await getCaseDocuments(brokerId, clientId);
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
    console.error("Admin case documents GET error:", error);
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
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "edit_cases")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para editar casos." }, { status: 403 });
    }

    const formData = await request.formData();
    const brokerId = String(formData.get("brokerId") || "");
    const clientId = String(formData.get("clientId") || "");
    const file = formData.get("file");

    if (!brokerId || !clientId) {
      return NextResponse.json({ error: "brokerId y clientId son requeridos" }, { status: 400 });
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

    const access = await checkCaseAccess(role, brokerId, clientId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const authorSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const uploadedByName = authorSnap.data()?.displayName || authorSnap.data()?.name || user.email || "Equipo E360";

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `case-documents/${brokerId}/${clientId}/${Date.now()}-${file.name}`;
    await adminStorage.bucket().file(storagePath).save(buffer, { contentType: file.type });

    const documentId = await addCaseDocument(brokerId, clientId, {
      fileName: file.name,
      storagePath,
      contentType: file.type,
      size: file.size,
      uploadedByName,
      uploadedById: user.uid
    });

    return NextResponse.json({ success: true, documentId });
  } catch (error) {
    console.error("Admin case documents POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

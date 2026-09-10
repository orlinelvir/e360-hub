import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { resolveUserRole, hasPermission } from "@/lib/roles";
import {
  getEffectiveServicesCatalog,
  setServiceOverride,
  clearServiceOverride,
  ServiceOverride
} from "@/lib/services/service-catalog-service";
import { servicesData } from "@/app/hub/broker-onboarding/data/services";

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "manage_services")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para gestionar el catálogo de servicios." }, { status: 403 });
    }

    // Se devuelve sin el ícono (componente de React, no serializable) — el
    // admin edita solo contenido, no la estructura visual del catálogo.
    const catalog = await getEffectiveServicesCatalog();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se destructura "icon" a propósito para excluirlo del payload serializable
    const serializable = catalog.map(({ icon: _icon, ...rest }) => rest);

    return NextResponse.json({ services: serializable });
  } catch (error) {
    console.error("Admin services GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "manage_services")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para gestionar el catálogo de servicios." }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, override } = body as { serviceId?: string; override?: ServiceOverride };

    if (!serviceId || !servicesData.some((s) => s.id === serviceId)) {
      return NextResponse.json({ error: "serviceId inválido" }, { status: 400 });
    }
    if (!override || typeof override !== "object") {
      return NextResponse.json({ error: "override es requerido" }, { status: 400 });
    }

    const editorSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const updatedByName = editorSnap.data()?.displayName || editorSnap.data()?.name || user.email || "Admin";

    await setServiceOverride(serviceId, override, updatedByName);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin services PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const role = await resolveUserRole(adminDb, user.uid, user.email);
    if (!hasPermission(role, "manage_services")) {
      return NextResponse.json({ error: "Acceso restringido. Se requiere permiso para gestionar el catálogo de servicios." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    if (!serviceId) {
      return NextResponse.json({ error: "serviceId es requerido" }, { status: 400 });
    }

    await clearServiceOverride(serviceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin services DELETE error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";
import { ROLE_DEFINITIONS, resolveUserRole, type RoleDefinition } from "@/lib/roles";

export type { RoleDefinition };
export { ROLE_DEFINITIONS };

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const currentRole = await resolveUserRole(adminDb, user.uid, user.email);

    if (currentRole !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de SuperAdmin." },
        { status: 403 }
      );
    }

    const brokersSnap = await adminDb.collection("brokers").get();
    const teamMembers: Array<{
      uid: string;
      displayName: string;
      email: string;
      phone: string;
      role: string;
      roleDetails?: RoleDefinition;
      updatedAt?: string;
    }> = [];

    brokersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const role = data.role || "broker";

      // Incluir usuarios que tienen un rol administrativo o de empleado
      if (role !== "broker") {
        const roleDef = ROLE_DEFINITIONS.find((r) => r.id === role) || {
          id: role,
          name: role,
          description: "Rol personalizado",
          allowedClusters: [],
          permissions: [],
          color: "gray"
        };

        teamMembers.push({
          uid: docSnap.id,
          displayName: data.displayName || data.name || "Usuario",
          email: data.email || "",
          phone: data.phone || "",
          role,
          roleDetails: roleDef,
          updatedAt: data.roleUpdatedAt || data.createdAt || ""
        });
      }
    });

    return NextResponse.json({
      teamMembers,
      roleDefinitions: ROLE_DEFINITIONS
    });
  } catch (error) {
    console.error("Admin roles GET error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const currentRole = await resolveUserRole(adminDb, user.uid, user.email);

    if (currentRole !== "admin") {
      return NextResponse.json(
        { error: "Acceso restringido. Se requiere rol de SuperAdmin para modificar roles." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUid, role } = body;

    if (!targetUid || !role) {
      return NextResponse.json({ error: "targetUid y role son requeridos" }, { status: 400 });
    }

    const validRoleIds = ROLE_DEFINITIONS.map((r) => r.id);
    if (!validRoleIds.includes(role)) {
      return NextResponse.json({ error: "El rol especificado no es válido" }, { status: 400 });
    }

    const targetUserRef = adminDb.collection("brokers").doc(targetUid);
    const targetSnap = await targetUserRef.get();

    if (!targetSnap.exists) {
      return NextResponse.json({ error: "Usuario o broker no encontrado en Firestore" }, { status: 404 });
    }

    await targetUserRef.update({
      role,
      roleUpdatedAt: new Date().toISOString(),
      roleAssignedBy: user.email || user.uid
    });

    return NextResponse.json({
      success: true,
      targetUid,
      role,
      message: `Rol '${role}' asignado exitosamente al usuario.`
    });
  } catch (error) {
    console.error("Admin roles POST error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

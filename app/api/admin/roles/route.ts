import { NextResponse } from "next/server";
import { verifyAuthToken, adminDb } from "@/lib/firebase-admin";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  allowedClusters: string[];
  permissions: string[];
  color: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "admin",
    name: "SuperAdmin / Director",
    description: "Acceso total: todas las verticales, comisiones, métricas, finanzas y asignación de roles.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["all"],
    color: "purple"
  },
  {
    id: "underwriter_mca",
    name: "Underwriter / Fondeo MCA",
    description: "Gestión exclusiva de solicitudes de Préstamos de Negocio (MCA), Préstamos Convencionales y Tarjetas.",
    allowedClusters: ["fondeo_rapido"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "blue"
  },
  {
    id: "specialist_real_estate",
    name: "Especialista Real Estate & Hipotecas",
    description: "Gestión exclusiva de préstamos hipotecarios, FHA, DSCR e inversión inmobiliaria.",
    allowedClusters: ["real_estate"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "emerald"
  },
  {
    id: "specialist_insurance",
    name: "Especialista de Seguros",
    description: "Gestión exclusiva de pólizas de auto personal, commercial trucking, casa, GL y workers comp.",
    allowedClusters: ["seguros"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "cyan"
  },
  {
    id: "specialist_corporate",
    name: "Especialista Corporativo & Taxes",
    description: "Gestión de registros de LLC, preparación de taxes, inmigración (USCIS), nómina y POS.",
    allowedClusters: ["corporativo"],
    permissions: ["view_cases", "edit_cases", "add_notes"],
    color: "amber"
  },
  {
    id: "support_agent",
    name: "Agente de Soporte & Operaciones",
    description: "Atención a tickets de brokers, reintento de sincronizaciones GHL y asistencia general.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["view_tickets", "reply_tickets", "retry_sync"],
    color: "indigo"
  },
  {
    id: "onboarding_member",
    name: "Representante de Onboarding",
    description: "Revisión de nuevos brokers, aprovisionamiento de subcuentas GHL y entrega de accesos.",
    allowedClusters: ["corporativo"],
    permissions: ["view_subaccounts", "manage_brokers", "onboarding_setup"],
    color: "emerald"
  },
  {
    id: "sales_agent",
    name: "Representante de Ventas / Closer",
    description: "Gestión de prospectos comerciales, intake de clientes y seguimiento de conversiones.",
    allowedClusters: ["fondeo_rapido", "real_estate", "credit_repair", "seguros", "corporativo"],
    permissions: ["view_cases", "create_leads", "view_commissions"],
    color: "amber"
  },
  {
    id: "broker",
    name: "Broker Estándar",
    description: "Acceso estándar de afiliado: solo ve sus propios clientes, comisiones y herramientas.",
    allowedClusters: [],
    permissions: ["view_own_clients"],
    color: "gray"
  }
];

const MASTER_ADMIN_EMAILS = [
  "fernando.elvire360@gmail.com",
  "admin@emprende360.biz",
  "soporte@emprende360.info",
  "jp@startpoint.biz"
];

export async function GET(request: Request) {
  const user = await verifyAuthToken(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  try {
    const isMaster = MASTER_ADMIN_EMAILS.includes((user.email || "").toLowerCase().trim());
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const currentRole = isMaster ? "admin" : (adminSnap.exists ? adminSnap.data()?.role : undefined);

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
    const isMaster = MASTER_ADMIN_EMAILS.includes((user.email || "").toLowerCase().trim());
    const adminSnap = await adminDb.collection("brokers").doc(user.uid).get();
    const currentRole = isMaster ? "admin" : (adminSnap.exists ? adminSnap.data()?.role : undefined);

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

import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envPath = path.resolve(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const read = (k: string) => env.match(new RegExp("^" + k + "=(.+)$", "m"))?.[1]?.trim() || "";

const projectId = read("FIREBASE_PROJECT_ID") || read("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail = read("FIREBASE_CLIENT_EMAIL");
const privateKey = read("FIREBASE_PRIVATE_KEY").replace(/^"|"$/g, "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan credenciales de servicio en .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

(async () => {
  console.log("=== provisionedSubaccounts (auto-provisioning exitoso) ===");
  const provisioned = await db.collection("provisionedSubaccounts").orderBy("createdAt", "desc").limit(20).get();
  if (provisioned.empty) {
    console.log("VACÍO — nunca se ha creado ni una sola subcuenta automáticamente.");
  } else {
    provisioned.docs.forEach((d) => {
      const data = d.data();
      console.log(`- ${data.createdAt} | ${data.email} | ${data.businessName || data.fullName} | locationId=${data.locationId}`);
    });
  }

  console.log("\n=== ghlWebhookLogs (últimos 20, cualquier tipo) ===");
  const logs = await db.collection("ghlWebhookLogs").orderBy("receivedAt", "desc").limit(20).get();
  if (logs.empty) {
    console.log("VACÍO — ningún evento de webhook ha quedado registrado (nota: hoy solo el evento de pipeline_stage_sync escribe aquí, broker_onboarding_form_submitted no persiste ni éxito ni fallo en esta colección).");
  } else {
    logs.docs.forEach((d) => {
      const data = d.data();
      console.log(`- ${data.receivedAt} | ${data.eventType} | success=${data.success} | reason=${data.reason || "-"} | errorMessage=${data.errorMessage || "-"} | email=${data.email || "-"}`);
    });
  }

  process.exit(0);
})().catch((err) => {
  console.error("Error consultando Firestore:", err);
  process.exit(1);
});

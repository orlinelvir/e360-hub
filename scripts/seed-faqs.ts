/**
 * Seed de FAQs en Firestore (colección `supportKnowledge`).
 * Uso: npm run seed:faqs
 *
 * Importa FALLBACK_FAQS desde lib/ai/fallback-faqs (sin dependencias de Firebase)
 * para evitar que firebase-admin se inicialice antes de leer .env.local.
 */

import { resolve } from "path";
import { readFileSync } from "fs";

// --- Parser robusto de .env.local (sin dotenv para no agregar dependencias en runtime) ---
function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return result;
  }
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx < 1) continue;
    const key = line.substring(0, eqIdx).trim();
    let val = line.substring(eqIdx + 1).trim();
    // Quitar comillas envolventes simples o dobles
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// Leer env ANTES de cualquier import de firebase
const envVars = parseEnvFile(resolve(process.cwd(), ".env.local"));
const projectId = envVars["FIREBASE_PROJECT_ID"] || envVars["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] || "";
const clientEmail = envVars["FIREBASE_CLIENT_EMAIL"] || "";
const privateKey = (envVars["FIREBASE_PRIVATE_KEY"] || "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Faltan credenciales de Firebase en .env.local:");
  console.error(`   FIREBASE_PROJECT_ID    : ${projectId ? `✓ (${projectId})` : "✗ FALTA"}`);
  console.error(`   FIREBASE_CLIENT_EMAIL  : ${clientEmail ? "✓" : "✗ FALTA"}`);
  console.error(`   FIREBASE_PRIVATE_KEY   : ${privateKey.length > 0 ? `✓ (${privateKey.length} chars)` : "✗ FALTA"}`);
  process.exit(1);
}

// Ahora sí importamos firebase-admin, con las vars ya listas en el scope del módulo
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// FALLBACK_FAQS viene de un archivo sin dependencias de Firebase
import { FALLBACK_FAQS } from "../lib/ai/fallback-faqs";

const app = getApps().length > 0
  ? getApps()[0]
  : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const db = getFirestore(app);

(async () => {
  let created = 0;
  let updated = 0;
  let failed = 0;

  console.log(`\n📚 Poblando ${FALLBACK_FAQS.length} FAQs en Firestore`);
  console.log(`   Proyecto: ${projectId}`);
  console.log(`   Colección: supportKnowledge\n`);

  for (const faq of FALLBACK_FAQS) {
    try {
      // ID determinista basado en la pregunta para evitar duplicados en re-runs.
      const docId = faq.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 120);

      const ref = db.collection("supportKnowledge").doc(docId);
      const snap = await ref.get();

      if (snap.exists) {
        await ref.set(faq, { merge: true });
        console.log(`  ↻ Actualizada: "${faq.question.substring(0, 70)}"`);
        updated++;
      } else {
        await ref.set(faq);
        console.log(`  ✓ Creada:      "${faq.question.substring(0, 70)}"`);
        created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      console.error(`  ❌ Error en FAQ "${faq.question.substring(0, 50)}...": ${msg}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  ✓ Creadas:      ${created}`);
  console.log(`  ↻ Actualizadas: ${updated}`);
  console.log(`  ❌ Con error:   ${failed}`);
  console.log(`─────────────────────────────────────────\n`);

  process.exit(failed > 0 ? 1 : 0);
})();

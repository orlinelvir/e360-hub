import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { FALLBACK_FAQS } from "../lib/ai/knowledge-base";

const envPath = path.resolve(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const read = (k: string) => env.match(new RegExp("^" + k + "=(.+)$", "m"))?.[1]?.trim() || "";

const projectId = read("FIREBASE_PROJECT_ID") || read("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail = read("FIREBASE_CLIENT_EMAIL");
const privateKey = read("FIREBASE_PRIVATE_KEY").replace(/^"|"$/g, "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltan credenciales de servicio de Firebase en .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

(async () => {
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const faq of FALLBACK_FAQS) {
    try {
      // Usa la pregunta como ID documento (sanitizado) para evitar duplicados.
      const docId = faq.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 120);

      const ref = db.collection("supportKnowledge").doc(docId);
      const snap = await ref.get();

      if (snap.exists) {
        await ref.set(faq, { merge: true });
        updated++;
      } else {
        await ref.set(faq);
        created++;
      }
    } catch (err) {
      console.error(`❌ Error procesando FAQ "${faq.question}":`, err);
      failed++;
    }
  }

  console.log(`\nListo: ${created} creadas, ${updated} actualizadas, ${failed} con error.`);
  process.exit(failed > 0 ? 1 : 0);
})();

import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) {
  console.error("Uso: npx tsx scripts/grant-admin.ts <correo-del-broker>");
  process.exit(1);
}

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
const auth = getAuth(app);
const db = getFirestore(app);

(async () => {
  try {
    const record = await auth.getUserByEmail(email);
    const uid = record.uid;
    await db.collection("brokers").doc(uid).set({ role: "admin" }, { merge: true });
    console.log(`OK: ${email} (uid ${uid}) ahora tiene rol 'admin'.`);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "auth/user-not-found") {
      console.error(`No existe un usuario con el correo ${email}.`);
    } else {
      console.error("Error:", err.message);
    }
    process.exit(1);
  }
})();

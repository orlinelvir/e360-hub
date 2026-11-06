import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { STAFF_GUIDES } from "../lib/staff-guides";

// Mismo patrón que upload-guides.ts, pero deliberadamente separado: estos
// PDFs son de uso interno (ver lib/staff-guides.ts) y suben a staff-guides/,
// no a guides/ (el catálogo público que sirve /api/guides/[slug]).

const envPath = path.resolve(process.cwd(), ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const read = (k: string) => env.match(new RegExp("^" + k + "=(.+)$", "m"))?.[1]?.trim() || "";

const projectId = read("FIREBASE_PROJECT_ID") || read("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const clientEmail = read("FIREBASE_CLIENT_EMAIL");
const privateKey = read("FIREBASE_PRIVATE_KEY").replace(/^"|"$/g, "").replace(/\\n/g, "\n");
const storageBucket = read("FIREBASE_STORAGE_BUCKET") || read("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

if (!projectId || !clientEmail || !privateKey || !storageBucket) {
  console.error("Faltan credenciales de servicio o el bucket de Storage en .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket });
const bucket = getStorage(app).bucket();

const LOCAL_PATHS: Record<string, string> = {
  "induccion-staff": "Docs y Audios/Staff/Guia de Induccion E360 Staff.pdf"
};

(async () => {
  let uploaded = 0;
  let failed = 0;

  for (const guide of STAFF_GUIDES) {
    const localPath = LOCAL_PATHS[guide.slug];
    if (!localPath) {
      console.error(`⚠️  Sin ruta local mapeada para slug "${guide.slug}", se omite.`);
      failed++;
      continue;
    }

    const absolutePath = path.resolve(process.cwd(), localPath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`⚠️  No se encontró el archivo: ${absolutePath}`);
      failed++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(absolutePath);
      await bucket.file(guide.storagePath).save(buffer, { contentType: "application/pdf" });
      console.log(`✅ ${guide.slug} -> ${guide.storagePath}`);
      uploaded++;
    } catch (err) {
      console.error(`❌ Error subiendo ${guide.slug}:`, err);
      failed++;
    }
  }

  console.log(`\nListo: ${uploaded} subidos, ${failed} con error.`);
  process.exit(failed > 0 ? 1 : 0);
})();

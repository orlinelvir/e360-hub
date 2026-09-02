import * as fs from "fs";
import * as path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { GUIDES } from "../lib/ai/guides";

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

// slug -> ruta local del PDF real en el repo (ver "Docs y Audios/").
const LOCAL_PATHS: Record<string, string> = {
  "mca": "Docs y Audios/Documentos y Guías adicionales/Guia MCA Para Brokers Emprende360.pdf",
  "sba": "Docs y Audios/Documentos y Guías adicionales/Guia Prestamos SBA Emprende360.pdf",
  "fondeo": "Docs y Audios/Documentos y Guías adicionales/E360 Guia Fondeo.pdf",
  "bienes-raices": "Docs y Audios/Documentos y Guías adicionales/e360-guia-financiamiento-bienes-raices.pdf",
  "registro-empresas": "Docs y Audios/Documentos y Guías adicionales/Guia Registro de Empresas Emprende360.pdf",
  "credito-empresarial": "Docs y Audios/Documentos y Guías adicionales/Cheatsheet Credito Empresarial Broker Emprende360.pdf",
  "credito-empresarial-script": "Docs y Audios/Documentos y Guías adicionales/Cheatsheet Credito Empresarial y Script Emprende360.pdf",
  "done-for-you": "Docs y Audios/Documentos y Guías adicionales/Guia Done For You Emprende360.pdf",
  "proceso-broker-credito": "Docs y Audios/Documentos y Guías adicionales/Proceso_Broker_Credito.pdf",
  "reparacion-credito-clientes": "Docs y Audios/Documentos y Guías adicionales/Reparacion_Credito_Clientes.pdf",
  "precios-reparacion-credito": "Docs y Audios/Documentos y Guías adicionales/Guia Precios Broker reparacion de credito.pdf",
  "config-ghl-pipelines": "Docs y Audios/Documentos y Guías adicionales/Guia Configuracion GHL Pipelines Emprende360.pdf",
  "primeros-compradores": "Docs y Audios/Documentos y Guías adicionales/Guia_Emprende360_programas_primeros_compradores_50_estados.pdf",
  "lead-flow": "Docs y Audios/Documentos y Guías adicionales/Cheatsheet Lead Flow Broker Emprende360.pdf",
  "consolidacion-synchrony": "Docs y Audios/Documentos y Guías adicionales/Cheatsheet Consolidacion Synchrony Broker Emprende360.pdf",
  "prestamos-empresariales": "Docs y Audios/Documentos y Guías adicionales/Cheatsheet_Prestamos_Empresariales_Emprende360-1.pdf",
  "onboarding-broker": "Docs y Audios/E360 Hub Onboarding Broker Descripcion.pdf"
};

(async () => {
  let uploaded = 0;
  let failed = 0;

  for (const guide of GUIDES) {
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

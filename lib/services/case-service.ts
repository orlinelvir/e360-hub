import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { CaseNote, CaseNoteCategory, CaseDocument } from "@/app/hub/broker-onboarding/types";

function clientRef(brokerId: string, clientId: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(brokerId).collection("clients").doc(clientId);
}

export async function getCaseNotes(brokerId: string, clientId: string, categories?: CaseNoteCategory[]): Promise<CaseNote[]> {
  const snap = await clientRef(brokerId, clientId).collection("caseNotes").orderBy("createdAt", "desc").get();
  const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CaseNote));
  return categories ? notes.filter((n) => categories.includes(n.category)) : notes;
}

export async function addCaseNote(
  brokerId: string,
  clientId: string,
  note: { category: CaseNoteCategory; content: string; authorName: string; authorId: string }
): Promise<string> {
  const docRef = await clientRef(brokerId, clientId).collection("caseNotes").add({
    ...note,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getCaseDocuments(brokerId: string, clientId: string): Promise<CaseDocument[]> {
  const snap = await clientRef(brokerId, clientId).collection("caseDocuments").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CaseDocument));
}

export async function addCaseDocument(
  brokerId: string,
  clientId: string,
  document: Omit<CaseDocument, "id" | "createdAt">
): Promise<string> {
  const docRef = await clientRef(brokerId, clientId).collection("caseDocuments").add({
    ...document,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

interface DeleteBrokerClientResult {
  clientName: string;
  ghlContactId?: string;
  ghlOpportunityId?: string;
  notesDeleted: number;
  documentsDeleted: number;
  storageFilesDeleted: number;
}

/**
 * Borra un cliente/admisión de un broker junto con todas sus subcolecciones
 * (caseNotes, caseDocuments, creditRepairCase, feeRounds) y los archivos
 * huérfanos en Storage bajo case-documents/{brokerId}/{clientId}/ — Firestore
 * no hace cascade-delete de subcolecciones por su cuenta. Uso previsto: borrar
 * admisiones duplicadas (ej. doble envío del formulario de intake, que no
 * tiene ninguna validación contra duplicados — ver AdmisionFormModal.tsx).
 *
 * Deliberadamente NO toca nada en GHL (ghlContactId/ghlOpportunityId) — ese
 * contacto puede estar compartido entre varios de los duplicados, y borrarlo
 * ahí es una acción de terceros sin deshacer. Se devuelve para que quien borra
 * decida manualmente si también limpia GHL.
 */
export async function deleteBrokerClient(brokerId: string, clientId: string): Promise<DeleteBrokerClientResult> {
  if (!adminDb) throw new Error("Servidor no configurado");
  const ref = clientRef(brokerId, clientId);

  const snap = await ref.get();
  if (!snap.exists) throw new Error("Cliente no encontrado");
  const client = snap.data()!;

  const [notesSnap, docsSnap, creditRepairSnap, feeRoundsSnap] = await Promise.all([
    ref.collection("caseNotes").get(),
    ref.collection("caseDocuments").get(),
    ref.collection("creditRepairCase").get(),
    ref.collection("feeRounds").get()
  ]);

  const batch = adminDb.batch();
  notesSnap.docs.forEach((d) => batch.delete(d.ref));
  docsSnap.docs.forEach((d) => batch.delete(d.ref));
  creditRepairSnap.docs.forEach((d) => batch.delete(d.ref));
  feeRoundsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();

  let storageFilesDeleted = 0;
  if (adminStorage) {
    try {
      const [files] = await adminStorage.bucket().getFiles({ prefix: `case-documents/${brokerId}/${clientId}/` });
      if (files.length > 0) {
        await Promise.all(files.map((f) => f.delete()));
        storageFilesDeleted = files.length;
      }
    } catch (error) {
      console.error("Error borrando archivos de Storage del cliente eliminado:", error);
    }
  }

  return {
    clientName: client.name || "Sin nombre",
    ghlContactId: client.ghlContactId,
    ghlOpportunityId: client.ghlOpportunityId,
    notesDeleted: notesSnap.size,
    documentsDeleted: docsSnap.size,
    storageFilesDeleted
  };
}

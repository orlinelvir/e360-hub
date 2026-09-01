import { adminDb } from "@/lib/firebase-admin";
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

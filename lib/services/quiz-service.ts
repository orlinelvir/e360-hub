import { adminDb } from "@/lib/firebase-admin";
import { CRM_QUIZ_QUESTIONS, QUIZ_PASS_PERCENTAGE } from "@/lib/quiz/crm-questions";
import { QuizAttempt, QuizAnswerResult } from "@/app/hub/broker-onboarding/types";

function brokerRef(uid: string) {
  if (!adminDb) throw new Error("Servidor no configurado");
  return adminDb.collection("brokers").doc(uid);
}

/**
 * Califica un intento SIEMPRE en el servidor contra CRM_QUIZ_QUESTIONS — un
 * broker podría mandar cualquier "correct: true" desde el navegador, así que
 * nunca se confía en el cliente para decidir el puntaje real.
 */
export async function gradeAndSaveQuizAttempt(
  uid: string,
  rawAnswers: Array<{ questionId: string; selectedIndex: number }>
): Promise<QuizAttempt> {
  const answers: QuizAnswerResult[] = CRM_QUIZ_QUESTIONS.map((q) => {
    const given = rawAnswers.find((a) => a.questionId === q.id);
    const selectedIndex = typeof given?.selectedIndex === "number" ? given.selectedIndex : -1;
    return { questionId: q.id, selectedIndex, correct: selectedIndex === q.correctIndex };
  });

  const score = answers.filter((a) => a.correct).length;
  const totalQuestions = CRM_QUIZ_QUESTIONS.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= QUIZ_PASS_PERCENTAGE;
  const completedAt = new Date().toISOString();

  const ref = brokerRef(uid);
  const attemptRef = await ref.collection("quizAttempts").add({
    answers,
    score,
    totalQuestions,
    percentage,
    passed,
    completedAt
  });

  // Solo sube el "mejor puntaje" guardado, y solo fija quizPassedAt la
  // primera vez que se aprueba (no se sobreescribe en intentos posteriores).
  const brokerSnap = await ref.get();
  const brokerData = brokerSnap.data() || {};
  const update: Record<string, unknown> = {};
  if (percentage > (Number(brokerData.bestQuizScore) || 0)) {
    update.bestQuizScore = percentage;
  }
  if (passed && !brokerData.quizPassed) {
    update.quizPassed = true;
    update.quizPassedAt = completedAt;
  }
  if (Object.keys(update).length > 0) {
    await ref.update(update);
  }

  return { id: attemptRef.id, answers, score, totalQuestions, percentage, passed, completedAt };
}

export async function getQuizAttempts(uid: string): Promise<QuizAttempt[]> {
  const snap = await brokerRef(uid).collection("quizAttempts").orderBy("completedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuizAttempt);
}

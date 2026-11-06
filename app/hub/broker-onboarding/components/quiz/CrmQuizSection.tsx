"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CheckCircle2, XCircle, Loader2, Award, RotateCcw, X } from "lucide-react";
import { CRM_QUIZ_QUESTIONS, QUIZ_PASS_PERCENTAGE } from "@/lib/quiz/crm-questions";
import { QuizAttempt } from "../../types";

interface CrmQuizSectionProps {
  onClose: () => void;
}

type ViewState = "loading" | "intro" | "taking" | "result";

export default function CrmQuizSection({ onClose }: CrmQuizSectionProps) {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>("loading");
  const [bestAttempt, setBestAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/quiz/submit", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.attempts?.length > 0) {
          setBestAttempt(data.attempts.reduce((best: QuizAttempt, a: QuizAttempt) => (a.percentage > best.percentage ? a : best)));
        }
      } catch {
        // sin historial disponible — no bloquea empezar el examen
      } finally {
        setView("intro");
      }
    })();
  }, [user]);

  function handleStart() {
    setAnswers({});
    setError("");
    setView("taking");
  }

  async function handleSubmit() {
    if (!user) return;
    if (Object.keys(answers).length < CRM_QUIZ_QUESTIONS.length) {
      setError(`Responde todas las preguntas (${Object.keys(answers).length}/${CRM_QUIZ_QUESTIONS.length}).`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex })) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo calificar el examen.");
      setResult(data.attempt);
      setView("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el examen. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A182D] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#05101F] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Examen de Conocimiento del CRM</h3>
              <p className="text-xs text-gray-400">Basado en la Guía de Onboarding E360</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-300">
          {view === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
            </div>
          )}

          {view === "intro" && (
            <div className="space-y-4">
              <p>
                {CRM_QUIZ_QUESTIONS.length} preguntas de opción múltiple sobre el CRM: perfil, calendarios, equipo, landing pages y formularios. Necesitas{" "}
                <strong className="text-white">{QUIZ_PASS_PERCENTAGE}%</strong> para aprobar.
              </p>
              {bestAttempt && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    bestAttempt.passed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }`}
                >
                  Tu mejor resultado: <strong>{bestAttempt.percentage}%</strong> ({bestAttempt.score}/{bestAttempt.totalQuestions}) —{" "}
                  {bestAttempt.passed ? "Aprobado" : "No aprobado todavía"}
                </div>
              )}
              <button
                type="button"
                onClick={handleStart}
                className="w-full px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] transition-all cursor-pointer"
              >
                {bestAttempt ? "Volver a Intentar" : "Comenzar Examen"}
              </button>
            </div>
          )}

          {view === "taking" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-5"
            >
              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">{error}</div>}
              {CRM_QUIZ_QUESTIONS.map((q, qi) => (
                <div key={q.id} className="border border-gray-800 rounded-xl p-4 bg-[#05101F]">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">{q.phase}</span>
                  <p className="text-sm font-semibold text-white mt-1 mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                          answers[q.id] === oi ? "border-cyan-400 bg-cyan-500/10 text-white" : "border-gray-800 text-gray-300 hover:border-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === oi}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                          className="w-3.5 h-3.5 text-cyan-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
                <span>{submitting ? "Calificando..." : "Enviar Examen"}</span>
              </button>
            </form>
          )}

          {view === "result" && result && (
            <div className="space-y-4">
              <div
                className={`p-5 rounded-xl border text-center ${
                  result.passed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
                }`}
              >
                <p className={`text-3xl font-black ${result.passed ? "text-emerald-400" : "text-amber-400"}`}>{result.percentage}%</p>
                <p className="text-xs text-gray-300 mt-1">
                  {result.score} de {result.totalQuestions} correctas — {result.passed ? "¡Aprobado!" : `Necesitas ${QUIZ_PASS_PERCENTAGE}% para aprobar`}
                </p>
              </div>

              <div className="space-y-2">
                {CRM_QUIZ_QUESTIONS.map((q) => {
                  const a = result.answers.find((x) => x.questionId === q.id);
                  if (!a) return null;
                  return (
                    <div key={q.id} className={`p-3.5 rounded-xl border text-xs ${a.correct ? "border-gray-800 bg-[#05101F]" : "border-red-500/30 bg-red-500/5"}`}>
                      <div className="flex items-start gap-2">
                        {a.correct ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-200">{q.question}</p>
                          {!a.correct && (
                            <p className="text-gray-400 mt-1">
                              Tu respuesta: {q.options[a.selectedIndex] ?? "—"} · Correcta: <strong className="text-white">{q.options[q.correctIndex]}</strong>
                            </p>
                          )}
                          <p className="text-gray-500 mt-1">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Intentar de Nuevo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

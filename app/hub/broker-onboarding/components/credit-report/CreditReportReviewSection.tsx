"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FileText, Image as ImageIcon, ClipboardPaste, Upload, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { CreditReportAnalysis } from "../../types";
import { readPdfFile, looksScanned, pdfPagesToImages, blobToBase64 } from "./pdf-reader";
import CreditReportResults from "./CreditReportResults";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Mode = "pdf" | "img" | "txt";

interface CreditReportReviewSectionProps {
  brokerName: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "Alcanzaste el límite de análisis por ahora. Espera unos minutos e inténtalo de nuevo.",
  prompt_too_large: "El reporte es demasiado largo o tiene demasiadas páginas. Sube solo las páginas con cuentas y consultas.",
  image_rejected: "No se pudo leer alguna de las imágenes. Sube fotos más claras o usa el PDF.",
  invalid_json: "La respuesta llegó incompleta. Inténtalo otra vez; si se repite, sube menos páginas.",
  upstream_error: "Hubo un problema de conexión. Inténtalo de nuevo.",
  input_invalido: "El reporte es demasiado corto para analizarlo."
};

export default function CreditReportReviewSection({ brokerName }: CreditReportReviewSectionProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("pdf");

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [pdfInfo, setPdfInfo] = useState("");
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgInfo, setImgInfo] = useState("");
  const [txtInput, setTxtInput] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<CreditReportAnalysis | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const ctlRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function haveInput(): boolean {
    if (mode === "pdf") return !!(pdfDoc || pdfText);
    if (mode === "img") return imgFiles.length > 0;
    return txtInput.trim().length > 200;
  }
  const canAnalyze = haveInput() && authChecked && !loading;

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPdfDoc(null);
    setPdfText("");
    setPdfInfo("");
    setError("");
    if (!f) return;
    try {
      const r = await readPdfFile(f, (p, total) => setPdfInfo(`Leyendo página ${p} de ${total}…`));
      const scanned = looksScanned(r.text);
      setPdfDoc(r.doc);
      setPdfText(r.text);
      setPdfInfo(scanned ? `${f.name} (${r.pages} páginas). Parece escaneado: se enviarán imágenes de las páginas.` : `${f.name} listo (${r.pages} páginas).`);
    } catch {
      setPdfInfo("No se pudo leer este PDF. Prueba con «Fotos o capturas» o «Pegar texto».");
    }
  }

  function handleImgChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 8);
    setImgFiles(files);
    setImgInfo(files.length ? `${files.length} imagen(es) seleccionada(s) (máximo 8)` : "");
  }

  function newAnalysis() {
    setAnalysis(null);
    setNotes([]);
    setPdfDoc(null);
    setPdfText("");
    setPdfInfo("");
    setImgFiles([]);
    setImgInfo("");
    setTxtInput("");
    setAuthChecked(false);
    setError("");
    window.scrollTo(0, 0);
  }

  async function analyze() {
    if (!user) return;
    setError("");
    setAnalysis(null);
    setLoading(true);
    setProgressMsg("Preparando el reporte…");
    const ctl = new AbortController();
    ctlRef.current = ctl;
    const t0 = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);

    try {
      let body: { text?: string; images?: { mimeType: string; data: string }[] };
      const localNotes: string[] = [];

      if (mode === "pdf") {
        const scanned = looksScanned(pdfText);
        if (scanned && pdfDoc) {
          setProgressMsg("Convirtiendo páginas a imágenes…");
          const blobs = await pdfPagesToImages(pdfDoc, 8);
          const images = await Promise.all(
            blobs.map(async (b) => ({ mimeType: "image/jpeg", data: await blobToBase64(b) }))
          );
          body = { images };
        } else {
          body = { text: pdfText };
        }
      } else if (mode === "img") {
        setProgressMsg("Procesando imágenes…");
        const images = await Promise.all(
          imgFiles.map(async (f) => ({ mimeType: f.type || "image/jpeg", data: await blobToBase64(f) }))
        );
        body = { images };
      } else {
        body = { text: txtInput };
      }

      setProgressMsg("Analizando el reporte con IA…");
      const token = await user.getIdToken();
      const res = await fetch("/api/credit-repair/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: ctl.signal
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data.code && ERROR_MESSAGES[data.code]) || data.error || "No se pudo completar el análisis.");
      }
      setAnalysis(data.analysis);
      setNotes([...localNotes, ...(data.notes || [])]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // detenido por el usuario
      } else {
        setError(err instanceof Error ? err.message : "No se pudo completar el análisis. Inténtalo de nuevo.");
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setLoading(false);
      ctlRef.current = null;
      setElapsed(0);
    }
  }

  if (analysis) {
    return <CreditReportResults analysis={analysis} notes={notes} brokerName={brokerName} onNewAnalysis={newAnalysis} />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-[#0A182D] to-[#05101F] border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-extrabold text-white">Revisión de Reporte de Crédito</h2>
        <p className="text-sm text-gray-400 mt-1.5">
          Sube el reporte de tu cliente y obtén qué lo está afectando y el plan más rápido para mejorarlo, explicado para que puedas contárselo con claridad.
        </p>
      </div>

      <section className="bg-[#0A182D]/80 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Reporte del cliente</h3>

        <div className="flex rounded-xl border border-gray-800 overflow-hidden bg-[#05101F]">
          {([
            { id: "pdf" as Mode, label: "PDF", icon: FileText },
            { id: "img" as Mode, label: "Fotos o capturas", icon: ImageIcon },
            { id: "txt" as Mode, label: "Pegar texto", icon: ClipboardPaste }
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === tab.id ? "bg-cyan-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {mode === "pdf" && (
          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#05101F]">
              <Upload size={22} className="text-gray-500" />
              <strong className="text-white text-sm">Toca para elegir el PDF del reporte</strong>
              <span className="text-xs text-gray-500">Reporte de los 3 burós de cualquier plataforma de monitoreo</span>
              <input type="file" accept="application/pdf,.pdf" onChange={handlePdfChange} className="hidden" />
            </label>
            {pdfInfo && <p className="text-xs text-gray-400 mt-2 break-words">{pdfInfo}</p>}
          </div>
        )}

        {mode === "img" && (
          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#05101F]">
              <Upload size={22} className="text-gray-500" />
              <strong className="text-white text-sm">Toca para elegir las fotos o capturas</strong>
              <span className="text-xs text-gray-500">Sube todas las páginas del reporte (hasta 8 imágenes)</span>
              <input type="file" accept="image/*" multiple onChange={handleImgChange} className="hidden" />
            </label>
            {imgInfo && <p className="text-xs text-gray-400 mt-2">{imgInfo}</p>}
          </div>
        )}

        {mode === "txt" && (
          <textarea
            value={txtInput}
            onChange={(e) => setTxtInput(e.target.value)}
            placeholder="Pega aquí el contenido del reporte de crédito"
            rows={8}
            className="w-full bg-[#05101F] border border-gray-800 focus:border-cyan-400 rounded-xl p-3 text-sm text-white placeholder-gray-600 outline-none resize-y"
          />
        )}

        <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={authChecked}
            onChange={(e) => setAuthChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-[#05101F] border-gray-700 focus:ring-0 cursor-pointer shrink-0"
          />
          <span>Tengo la autorización firmada del cliente para revisar su reporte de crédito.</span>
        </label>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 p-3.5 border border-gray-800 rounded-xl bg-[#05101F]">
            <Loader2 size={20} className="animate-spin text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-white font-semibold">{progressMsg}</p>
              <p className="text-[11px] text-gray-500">Analizando… {elapsed}s. Puede tardar hasta 2 minutos.</p>
            </div>
            <button
              type="button"
              onClick={() => ctlRef.current?.abort()}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
            >
              Detener
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={analyze}
            disabled={!canAnalyze}
            className="w-full px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,224,240,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analizar reporte
          </button>
        )}

        <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
          <ShieldCheck size={13} className="shrink-0 mt-0.5" />
          <span>El contenido se envía solo para este análisis y no se guarda. Los números de Seguro Social se ocultan antes de enviarse.</span>
        </p>
      </section>
    </div>
  );
}

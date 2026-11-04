// Lectura de PDF 100% en el navegador (pdfjs-dist) — nunca se sube el PDF
// binario al servidor. Si el reporte tiene texto extraíble se manda texto
// (barato); si parece escaneado, se renderizan sus páginas a imágenes JPEG
// (ver pdfPagesToImages) y esas sí se mandan al backend.
//
// pdfjs-dist se importa con un dynamic import() dentro de cada función, nunca
// de forma estática arriba del archivo: su módulo toca `DOMMatrix` (un global
// del navegador) en tiempo de evaluación, y Next.js server-renderiza incluso
// los Client Components en el primer pase — un import estático tumbaba el SSR
// de TODO /hub/broker-onboarding con "DOMMatrix is not defined", no solo esta
// pestaña.

import type { PDFDocumentProxy } from "pdfjs-dist";

let workerConfigured = false;
async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjsLib;
}

export interface ReadPdfResult {
  doc: PDFDocumentProxy;
  pages: number;
  text: string;
}

export async function readPdfFile(file: File, onPageProgress?: (page: number, total: number) => void): Promise<ReadPdfResult> {
  const pdfjsLib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const parts: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    onPageProgress?.(p, doc.numPages);
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    const lines: string[] = [];
    tc.items.forEach((item) => {
      if (!("str" in item)) return;
      const y = item.transform ? item.transform[5] : 0;
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + " ";
      lastY = y;
    });
    if (line.trim()) lines.push(line.trim());
    parts.push(`--- Página ${p} ---\n${lines.join("\n")}`);
  }

  return { doc, pages: doc.numPages, text: parts.join("\n\n") };
}

export function looksScanned(text: string): boolean {
  return text.replace(/--- Página \d+ ---/g, "").trim().length < 1200;
}

export async function pdfPagesToImages(doc: PDFDocumentProxy, max: number): Promise<Blob[]> {
  const out: Blob[] = [];
  const n = Math.min(doc.numPages, max);
  for (let p = 1; p <= n; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1.3 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    await page.render({ canvas, viewport: vp }).promise;
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
    if (blob) out.push(blob);
  }
  return out;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

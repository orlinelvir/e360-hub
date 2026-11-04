import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { CreditReportAnalysis, CreditReportIssue, CreditReportIssueType, CreditReportDisputable, CreditReportImpact } from "../../types";

export const BANDS: Array<[number, number, string, string]> = [
  [300, 579, "#b3261e", "Pobre"],
  [580, 669, "#d9822b", "Regular"],
  [670, 739, "#c9a227", "Bueno"],
  [740, 799, "#4f9d69", "Muy bueno"],
  [800, 850, "#1d6b3f", "Excepcional"]
];

export const TIPO_LABELS: Record<CreditReportIssueType, string> = {
  pago_tardio: "Pago tardío",
  coleccion: "Colección",
  charge_off: "Charge-off",
  consulta_dura: "Consulta dura",
  utilizacion_alta: "Utilización alta",
  error_de_datos: "Error en los datos",
  cuenta_duplicada: "Cuenta duplicada",
  cuenta_no_reconocida: "Cuenta no reconocida",
  bancarrota_o_registro_publico: "Registro público",
  historial_corto: "Historial corto",
  otro: "Otro"
};

export const DISPUTABLE_LABELS: Record<CreditReportDisputable, string> = {
  si: "Disputable",
  posible: "Posible: verificar primero",
  no: "No disputable por ahora"
};

export const IMPACT_LABELS: Record<CreditReportImpact, string> = {
  alto: "Impacto alto",
  medio: "Impacto medio",
  bajo: "Impacto bajo"
};

const USD = new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export function money(n: number | null | undefined): string {
  return typeof n === "number" && isFinite(n) ? USD.format(n) : "—";
}
export function pct(n: number | null | undefined): string {
  return typeof n === "number" && isFinite(n) ? Math.round(n) + "%" : "—";
}

const NEG_TYPES: CreditReportIssueType[] = [
  "pago_tardio",
  "coleccion",
  "charge_off",
  "bancarrota_o_registro_publico",
  "cuenta_no_reconocida",
  "error_de_datos",
  "cuenta_duplicada"
];
export function isNegativeIssue(p: CreditReportIssue): boolean {
  return p.es_negativo === true || (p.es_negativo == null && NEG_TYPES.includes(p.tipo));
}

export interface PricingTier {
  nombre: string;
  rango: string;
  evaluacion: number | null;
  mensual: number | null;
  meses: string;
  nota: string;
}

export const PRECIOS: Record<"n1" | "n2" | "n3" | "cr", PricingTier> = {
  n1: { nombre: "Nivel 1", rango: "1 a 5 elementos negativos", evaluacion: 250, mensual: 50, meses: "4 a 6 meses", nota: "" },
  n2: { nombre: "Nivel 2", rango: "6 a 10 elementos negativos, hasta 2 colecciones", evaluacion: 500, mensual: 50, meses: "6 a 8 meses", nota: "" },
  n3: {
    nombre: "Nivel 3",
    rango: "Más de 10 elementos negativos o más de 2 colecciones",
    evaluacion: null,
    mensual: null,
    meses: "8 a 12 meses",
    nota: "Incluye negociar con las compañías de cobro, armar un plan de pagos para el cliente y el proceso de disputas."
  },
  cr: {
    nombre: "Construcción de crédito",
    rango: "Historial insuficiente",
    evaluacion: 500,
    mensual: 50,
    meses: "alrededor de 6 meses",
    nota: "Se construye historial con tarjetas aseguradas o iniciales (por ejemplo Credit One o Capital One) y, más adelante, tradelines."
  }
};

export type TierKey = keyof typeof PRECIOS | "ninguno";

export function recommendTier(neg: number, col: number, thin: boolean): TierKey {
  if (thin && neg === 0) return "cr";
  if (neg > 10 || col > 2) return "n3";
  if (neg >= 6) return "n2";
  if (neg >= 1) return "n1";
  return thin ? "cr" : "ninguno";
}

export function initialCounts(d: CreditReportAnalysis, problems: CreditReportIssue[]): { neg: number; col: number; thin: boolean } {
  const c = d.conteos || { elementos_negativos: 0, colecciones: 0, historial_insuficiente: false };
  let neg = Number(c.elementos_negativos);
  let col = Number(c.colecciones);
  if (!isFinite(neg) || neg < 0) neg = problems.filter(isNegativeIssue).length;
  if (!isFinite(col) || col < 0) col = problems.filter((p) => p.tipo === "coleccion").length;
  return { neg: Math.round(neg), col: Math.round(col), thin: c.historial_insuficiente === true };
}

export function summaryText(d: CreditReportAnalysis): string {
  const L: string[] = [];
  const util = d.utilizacion || { porcentaje_global: null, tarjetas: [], recomendacion: null, explicacion_cliente: null };
  L.push("RESUMEN DE TU REPORTE DE CRÉDITO");
  L.push("Emprende 360");
  L.push("");
  const sc = (d.scores || []).filter((s) => typeof s.score === "number");
  if (sc.length) {
    L.push("Tus puntajes: " + sc.map((s) => `${s.buro} ${s.score}`).join(" | "));
    L.push("");
  }
  if (d.explicacion_para_el_cliente) {
    L.push(d.explicacion_para_el_cliente);
    L.push("");
  }
  const ps = [...(d.problemas || [])].sort((a, b) => (a.prioridad || 99) - (b.prioridad || 99));
  if (ps.length) {
    L.push("LO QUE ESTÁ AFECTANDO TU CRÉDITO");
    ps.forEach((p, i) => {
      L.push(`${i + 1}. ${p.acreedor || "Elemento"}: ${p.explicacion_cliente || p.detalle || ""}`);
    });
    L.push("");
  }
  if (util.explicacion_cliente) {
    L.push("UTILIZACIÓN DE TARJETAS");
    L.push(util.explicacion_cliente);
    L.push("");
  }
  const plan = d.plan || [];
  if (plan.length) {
    L.push("NUESTRO PLAN");
    plan.forEach((ph) => {
      L.push(`${ph.fase}${ph.titulo ? " - " + ph.titulo : ""}${ph.tiempo ? " (" + ph.tiempo + ")" : ""}`);
      (ph.pasos || []).forEach((s) => L.push("  - " + s));
    });
    L.push("");
  }
  if (d.expectativa_realista) {
    L.push("QUÉ ESPERAR");
    L.push(d.expectativa_realista);
    L.push("");
  }
  L.push("Importante: los resultados dependen de cada caso y no se pueden garantizar.");
  return L.join("\n");
}

function pdfSafe(s: string | null | undefined): string {
  return String(s == null ? "" : s)
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, "");
}

export function buildClientPdf(d: CreditReportAnalysis, clientName: string, brokerName: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const M = 40;
  let y: number;
  const problems = [...(d.problemas || [])].sort((a, b) => (a.prioridad || 99) - (b.prioridad || 99));
  const util = d.utilizacion || { porcentaje_global: null, tarjetas: [], recomendacion: null, explicacion_cliente: null };

  doc.setFillColor(13, 45, 94);
  doc.rect(0, 0, pw, 74, "F");
  doc.setFillColor(212, 160, 23);
  doc.rect(0, 74, pw, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(pdfSafe("Resumen de tu reporte de crédito"), M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Emprende 360", M, 58);
  y = 104;
  doc.setTextColor(20, 35, 59);
  doc.setFontSize(10);
  const fecha = new Date().toLocaleDateString("es-US");
  doc.text(pdfSafe((clientName ? "Preparado para: " + clientName + "     " : "") + "Fecha: " + fecha), M, y);
  y += 14;
  if (brokerName) {
    doc.text(pdfSafe("Preparado por: " + brokerName), M, y);
    y += 14;
  }
  y += 8;

  function ensure(hh: number) {
    if (y + hh > ph - 60) {
      doc.addPage();
      y = 50;
    }
  }
  function heading(txt: string) {
    ensure(44);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(13, 45, 94);
    doc.text(pdfSafe(txt), M, y);
    y += 6;
    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(1.5);
    doc.line(M, y, M + 60, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 35, 59);
  }
  function para(txt: string, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.splitTextToSize(pdfSafe(txt), pw - 2 * M).forEach((l: string) => {
      ensure(14);
      doc.text(l, M, y);
      y += 14;
    });
    doc.setFont("helvetica", "normal");
    y += 4;
  }

  const sc = (d.scores || []).filter((x) => typeof x.score === "number");
  if (sc.length) {
    heading("Tus puntajes");
    para(sc.map((x) => `${x.buro}: ${x.score}`).join("      "));
  }
  if (d.explicacion_para_el_cliente) {
    heading("Cómo está tu crédito hoy");
    para(d.explicacion_para_el_cliente);
  }
  const negs = problems.filter(isNegativeIssue);
  if (negs.length) {
    heading("Elementos negativos en tu reporte");
    const body = negs.map((p) => [
      pdfSafe((p.acreedor || "Elemento") + (p.cuenta_ultimos4 ? ` (...${p.cuenta_ultimos4})` : "")),
      pdfSafe(TIPO_LABELS[p.tipo] || "Otro"),
      pdfSafe(p.detalle),
      pdfSafe(p.explicacion_cliente)
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M, bottom: 60 },
      head: [["Acreedor", "Tipo", "Qué dice tu reporte", "Qué vamos a hacer"]],
      body,
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [20, 35, 59], lineColor: [214, 222, 234], lineWidth: 0.4, overflow: "linebreak" },
      headStyles: { fillColor: [13, 45, 94], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [244, 246, 249] },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 70 }, 2: { cellWidth: 170 }, 3: { cellWidth: "auto" } }
    });
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y += 14;
    const total = d.conteos && Number(d.conteos.elementos_negativos);
    if (total && total > negs.length) {
      para(`Aquí se muestran los elementos principales. En tu reporte hay ${total} elementos negativos en total.`);
    }
  }
  if (typeof util.porcentaje_global === "number" || util.explicacion_cliente) {
    heading("El uso de tus tarjetas");
    if (typeof util.porcentaje_global === "number") {
      para(`Estás usando aproximadamente ${Math.round(util.porcentaje_global)}% de tu límite total. Lo ideal es mantenerlo por debajo de 30%.`);
    }
    if (util.explicacion_cliente) para(util.explicacion_cliente);
  }
  const plan = d.plan || [];
  if (plan.length) {
    heading("Qué vamos a hacer");
    plan.forEach((ph2) => {
      para(`${ph2.fase}${ph2.titulo ? ": " + ph2.titulo : ""}${ph2.tiempo ? " (" + ph2.tiempo + ")" : ""}`, true);
      (ph2.pasos || []).forEach((st) => para("- " + st));
    });
  }
  if (d.expectativa_realista) {
    heading("Qué esperar");
    para(d.expectativa_realista);
  }
  para("Los resultados dependen de cada caso y no se pueden garantizar.", true);

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 124, 144);
    doc.text(pdfSafe("Resumen informativo de Emprende 360. No es asesoría legal ni garantiza resultados."), M, ph - 28);
    doc.text(`Página ${i} de ${n}`, pw - M - 60, ph - 28);
  }
  return doc;
}

// LMS export: flat, TEQSA-oriented metadata for a certified Assay Certificate.
// Wording rule: records are "mapped to" frameworks, never "compliant".
export const EXPORT_SCHEMA = "assayer-lms-export/1.0";

export type ExportRow = {
  id: string; provider: string; school: string; program: string; unit_code: string; unit_title: string;
  title: string; aqf_level: number; discipline: string; cohort_size: number; delivery_mode: string;
  teqsa_pathway: string; selected_stance: string | null; certificate_hash: string | null;
  prompt_version: string | null; model: string | null; updated_at: string; status: string;
  variants: unknown; scores: unknown; certificate: unknown;
};

type Section = { n: number; title: string; body: Record<string, unknown> };

function flatten(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(flatten).join("; ");
  return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${k}: ${flatten(x)}`).join("; ");
}

export function buildMetadata(row: ExportRow): [string, string][] {
  if (row.status !== "certified" || !row.certificate_hash) throw new Error("Only certified certificates can be exported.");
  const stance = row.selected_stance ?? "";
  const pick = <T extends { stance?: string }>(v: unknown): T | undefined =>
    Array.isArray(v) ? (v as T[]).find((x) => x.stance === stance) : (v as Record<string, T> | null)?.[stance];
  const variant = pick<{ stance?: string; aias_level?: string }>(row.variants);
  const s = pick<{ stance?: string; total?: number; criteria?: { name: string; score: number }[] }>(row.scores);
  const meta: [string, string][] = [
    ["export_schema", EXPORT_SCHEMA],
    ["record_id", row.id],
    ["provider", row.provider],
    ["school", row.school],
    ["program", row.program],
    ["unit_code", row.unit_code],
    ["unit_title", row.unit_title],
    ["assessment_title", row.title],
    ["aqf_level", String(row.aqf_level)],
    ["discipline", row.discipline],
    ["cohort_size", String(row.cohort_size)],
    ["delivery_mode", row.delivery_mode],
    ["teqsa_reform_pathway", row.teqsa_pathway],
    ["framework_mapping", "Mapped to TEQSA assessment reform guidance (2023, 2025, 2026), HESF 2021 and ACSES 2025 — interpretive mapping, not official equivalence"],
    ["certified_stance", stance],
    ["aias_level", variant?.aias_level ?? ""],
    ["alignment_total_out_of_100", s?.total != null ? String(s.total) : ""],
    ...((s?.criteria ?? []).map((c, i) => [`criterion_${i + 1}`, `${c.name}: ${c.score}/20`] as [string, string])),
    ["certificate_sha256", row.certificate_hash],
    ["prompt_version", row.prompt_version ?? ""],
    ["model", row.model ?? ""],
    ["certified_at", row.updated_at],
    ["human_signoff_required", "Unit Coordinator; Head of School or Associate Dean (Learning and Teaching)"],
    ["status_note", "Prototype sandbox record; not institutionally endorsed"],
  ];
  const log = row.certificate as { sections?: Section[] } | null;
  for (const sec of log?.sections ?? []) meta.push([`section_${sec.n}_${sec.title}`, flatten(sec.body)]);
  return meta;
}

const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Two columns (field,value) — imports cleanly into Canvas, Moodle, Blackboard gradebook notes or spreadsheets. */
export function toCsv(meta: [string, string][]): string {
  return "\uFEFF" + ["field,value", ...meta.map(([k, v]) => `${esc(k)},${esc(v)}`)].join("\r\n") + "\r\n";
}

export function exportFilename(row: ExportRow, ext: string) {
  return `assay-certificate_${row.unit_code || "unit"}_${(row.certificate_hash ?? "").slice(0, 12)}.${ext}`;
}

export async function toPdf(meta: [string, string][]): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle("Assay Certificate — LMS export");
  doc.setSubject("Faculty AI Governance Log");
  doc.setKeywords(meta.filter(([k]) => ["unit_code", "aqf_level", "teqsa_reform_pathway", "certificate_sha256"].includes(k)).map(([k, v]) => `${k}=${v}`));
  doc.setProducer(EXPORT_SCHEMA);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  // Standard fonts are WinAnsi: replace unsupported characters.
  const safe = (t: string) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/×/g, "x").replace(/§/g, "S").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  const W = 595, H = 842, M = 48, size = 9, lh = 12, keyW = 150;
  let page = doc.addPage([W, H]); let y = H - M;
  const wrap = (t: string, f: typeof font, max: number) => {
    const out: string[] = []; let line = "";
    for (const w of safe(t).split(/\s+/)) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > max && line) { out.push(line); line = w; } else line = test;
    }
    if (line) out.push(line);
    return out.length ? out : [""];
  };
  const ensure = (h: number) => { if (y - h < M) { page = doc.addPage([W, H]); y = H - M; } };
  page.drawText("Assay Certificate - LMS export", { x: M, y, size: 18, font: bold }); y -= 22;
  page.drawText("Faculty AI Governance Log - mapped to TEQSA guidance (not a compliance statement)", { x: M, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) }); y -= 24;
  for (const [k, v] of meta) {
    const kl = wrap(k.replace(/_/g, " "), bold, keyW - 8), vl = wrap(v, font, W - 2 * M - keyW);
    const rows = Math.max(kl.length, vl.length);
    ensure(rows * lh + 6);
    for (let i = 0; i < rows; i++) {
      const a = kl[i], b = vl[i];
      if (a) page.drawText(a, { x: M, y, size, font: bold });
      if (b) page.drawText(b, { x: M + keyW, y, size, font });
      y -= lh;
    }
    y -= 6;
  }
  return doc.save();
}

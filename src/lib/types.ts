export type Stance = "assisted" | "limited" | "resistant";

export const STANCES: { key: Stance; label: string; rule: string; blurb: string }[] = [
  { key: "assisted", label: "AI-Assisted", rule: "AI designed in", blurb: "Students may use AI openly, but must document, verify and critique what it produced." },
  { key: "limited", label: "AI-Limited", rule: "AI designed to be bounded", blurb: "AI permitted for narrowly named steps only; the rest completed unaided." },
  { key: "resistant", label: "AI-Resistant", rule: "AI designed out", blurb: "An AI answer alone cannot pass: live defence, local data, in-class performance." },
];

export interface RubricRow {
  criterion: string;
  description: string;
  marks: number;
  clo: string;
  high_standard: string;
  pass_standard: string;
}

export interface EvidenceArtefact {
  artefact: string;
  specification: string;
  template: string;
  capability: string;
}

export interface Variant {
  stance: Stance;
  title: string;
  student_brief: string;
  clo_mapping: { clo: string; how: string }[];
  aias_level: string;
  ai_use_conditions: string;
  safeguards: string[];
  rubric: RubricRow[];
  context_anchors: { anchor: string; use: string }[];
  feasibility_notes: string;
  feasibility: { marking_minutes_per_student: number; total_marking_hours: number; sessional_note: string };
  process_evidence_kit: EvidenceArtefact[];
  verify_items: { claim: string; reason: string }[];
}

export interface Swap {
  stance: Stance;
  original: string;
  replacement: string;
  source: string;
}

export interface CriterionScore {
  name: string;
  score: number;
  justification: string;
}

export interface VariantScore {
  stance: Stance;
  total: number;
  criteria: CriterionScore[];
}

export const CRITERIA = [
  "Evaluative judgement of AI output",
  "Verification and sourcing",
  "Metacognitive regulation and process evidence",
  "Ethical reasoning and responsible AI practice",
  "Contextual application to the Australian setting and communication of judgement",
];

export interface PrivacyState {
  flags_total?: number;
  removed?: number;
  kept?: string[];
  declarations?: boolean[];
  scanned_at?: string;
}

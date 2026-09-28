// AI choke point implementation. Server-only. No page may import the AI SDK.
import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod/v4";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AI_CONFIG } from "./config.server";
import { PREAMBLE, PROMPT_VERSION, certificatePrompt, contextPrompt, scorePrompt, variantPrompt } from "./prompts.server";
import { unresolvedFlags, CATEGORY_LABEL } from "@/lib/privacy-scan";
import { canonicalize, sha256Hex } from "@/lib/canonical";
import { CRITERIA, STANCES, type Stance, type Variant, type Swap, type VariantScore, type PrivacyState } from "@/lib/types";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["assessments"]["Row"];

export class GatewayError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(`${code}: ${message}`);
  }
}

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

async function structured<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new GatewayError("CONFIG", "AI key is not configured", 500);
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: AI_CONFIG.baseURL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID_HEADER, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID_HEADER) ?? undefined;
      if (res.status === 402) throw new GatewayError("CREDITS", "AI credits are exhausted for this workspace.", 402);
      if (res.status === 429) throw new GatewayError("RATE_LIMITED", "The AI service is busy. Please try again in a minute.", 429);
      return res;
    },
  });
  const result = streamText({
    model: provider.responses(AI_CONFIG.model),
    system: PREAMBLE,
    prompt,
    output: Output.object({ schema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: AI_CONFIG.reasoningEffort,
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return (await result.output) as T;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e) && e.text) {
      try {
        return schema.parse(JSON.parse(e.text));
      } catch {
        /* fall through */
      }
    }
    if (e instanceof GatewayError) throw e;
    console.error("AI call failed", e);
    throw new GatewayError("AI_FAILED", "The AI service could not complete this step.", 502);
  }
}

// ---------- schemas (strict: all required, no bounds) ----------
const VariantSchema = z.object({
  title: z.string(),
  student_brief: z.string(),
  clo_mapping: z.array(z.object({ clo: z.string(), how: z.string() })),
  aias_level: z.string(),
  ai_use_conditions: z.string(),
  safeguards: z.array(z.string()),
  rubric: z.array(
    z.object({
      criterion: z.string(),
      description: z.string(),
      marks: z.number(),
      clo: z.string(),
      high_standard: z.string(),
      pass_standard: z.string(),
    }),
  ),
  context_anchors: z.array(z.object({ anchor: z.string(), use: z.string() })),
  feasibility_notes: z.string(),
  feasibility: z.object({
    marking_minutes_per_student: z.number(),
    total_marking_hours: z.number(),
    sessional_note: z.string(),
  }),
  process_evidence_kit: z.array(
    z.object({ artefact: z.string(), specification: z.string(), template: z.string(), capability: z.string() }),
  ),
  verify_items: z.array(z.object({ claim: z.string(), reason: z.string() })),
});

const ContextSchema = z.object({
  student_brief: z.string(),
  context_anchors: z.array(z.object({ anchor: z.string(), use: z.string() })),
  swaps: z.array(z.object({ original: z.string(), replacement: z.string(), source: z.string() })),
});

const ScoreSchema = z.object({
  scores: z.array(
    z.object({
      stance: z.enum(["assisted", "limited", "resistant"]),
      criteria: z.array(z.object({ name: z.string(), score: z.number(), justification: z.string() })),
    }),
  ),
});

const CertSchema = z.object({
  original_summary: z.string(),
  vulnerability_profile: z.string(),
  redesign_rationale: z.string(),
  pathway_served: z.string(),
  pedagogical_justification: z.string(),
  maturity_rating: z.string(),
  employability_reasoning: z.string(),
  jsa_skills: z.array(z.string()),
  standards_mapping: z.array(
    z.object({ framework: z.string(), reference: z.string(), how_mapped: z.string(), status: z.string() }),
  ),
  integrity_fairness: z.string(),
  equity_notes: z.array(z.string()),
  accessibility_adjustments: z.string(),
});

// ---------- helpers ----------
async function loadRow(db: DB, id: string): Promise<Row> {
  const { data, error } = await db.from("assessments").select("*").eq("id", id).single();
  if (error || !data) throw new GatewayError("NOT_FOUND", "Assessment not found", 404);
  return data;
}

function tripwire(row: Row) {
  if (!row.privacy_cleared) throw new GatewayError("PRIVACY_GATE", "Complete the privacy gate first.", 422);
  const kept = ((row.privacy as PrivacyState)?.kept ?? []) as string[];
  const text = [row.clean_text, row.learning_outcomes, row.unit_title, row.program].join("\n");
  const hits = unresolvedFlags(text, kept);
  if (hits.length) {
    throw new GatewayError(
      "ANONYMISATION_VIOLATION",
      `Personal information detected (${[...new Set(hits.map((h) => CATEGORY_LABEL[h.category]))].join(", ")}). Generation blocked.`,
      422,
    );
  }
}

function contextBlock(row: Row) {
  return `UNIT CONTEXT
Provider: ${row.provider || "Australian university"}
Unit: ${row.unit_code} ${row.unit_title}
Program: ${row.program}
AQF level: ${row.aqf_level}
Discipline: ${row.discipline}
Cohort size: ${row.cohort_size}
Delivery mode: ${row.delivery_mode}
TEQSA reform pathway: ${row.teqsa_pathway}
Course learning outcomes:
${row.learning_outcomes}

ORIGINAL ASSESSMENT:
${row.clean_text}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

// ---------- tasks ----------
async function generateVariants(db: DB, row: Row) {
  const ctx = contextBlock(row);
  const results = await Promise.all(
    STANCES.map(async (s) => ({ ...(await structured(VariantSchema, variantPrompt(s.key, ctx))), stance: s.key }) as Variant),
  );
  const { error } = await db
    .from("assessments")
    .update({
      variants: results as never,
      swaps: null,
      scores: null,
      status: "drafted",
      prompt_version: PROMPT_VERSION,
      model: AI_CONFIG.model,
    })
    .eq("id", row.id);
  if (error) throw new GatewayError("DB", error.message, 500);
  return { variants: results };
}

async function contextPass(db: DB, row: Row) {
  const variants = (row.variants ?? []) as unknown as Variant[];
  if (!variants.length) throw new GatewayError("ORDER", "Generate variants first.", 409);
  const { data: anchors } = await db.from("context_anchors").select("discipline,generic_term,au_equivalent,source");
  const table = (anchors ?? []).map((a) => `- [${a.discipline}] ${a.generic_term} -> ${a.au_equivalent} (source: ${a.source})`).join("\n");
  const allowed = (anchors ?? []).map((a) => a.au_equivalent.toLowerCase());
  const allSwaps: Swap[] = [];
  const updated = await Promise.all(
    variants.map(async (v) => {
      const out = await structured(
        ContextSchema,
        contextPrompt(JSON.stringify({ student_brief: v.student_brief, context_anchors: v.context_anchors }), table),
      );
      const genuine = out.swaps.filter((s) => {
        const o = s.original.trim().toLowerCase();
        const r = s.replacement.trim().toLowerCase();
        if (!o || !r || o === r) return false; // identity / cosmetic
        return r.includes("to be confirmed") || allowed.some((a) => a.includes(r) || r.includes(a.split(" (")[0] ?? a));
      });
      genuine.forEach((s) => allSwaps.push({ ...s, stance: v.stance }));
      return { ...v, student_brief: out.student_brief, context_anchors: out.context_anchors };
    }),
  );
  const { error } = await db
    .from("assessments")
    .update({ variants: updated as never, swaps: allSwaps as never, status: "localised" })
    .eq("id", row.id);
  if (error) throw new GatewayError("DB", error.message, 500);
  return { variants: updated, swaps: allSwaps };
}

async function scoreAlignment(db: DB, row: Row) {
  const variants = (row.variants ?? []) as unknown as Variant[];
  if (!variants.length) throw new GatewayError("ORDER", "Generate variants first.", 409);
  const compact = variants.map((v) => ({
    stance: v.stance,
    brief: v.student_brief,
    conditions: v.ai_use_conditions,
    safeguards: v.safeguards,
    rubric: v.rubric.map((r) => `${r.criterion} (${r.marks})`),
    process_evidence: v.process_evidence_kit.map((p) => p.artefact),
    anchors: v.context_anchors.map((a) => a.anchor),
  }));
  const out = await structured(ScoreSchema, scorePrompt(JSON.stringify(compact), contextBlock(row)));
  const scores: VariantScore[] = STANCES.map((s) => {
    const found = out.scores.find((x) => x.stance === s.key);
    const criteria = CRITERIA.map((name, i) => {
      const c = found?.criteria[i];
      return { name, score: clamp(c?.score ?? 0, 0, 20), justification: c?.justification ?? "Not scored." };
    });
    return { stance: s.key, criteria, total: criteria.reduce((a, c) => a + c.score, 0) };
  });
  const { error } = await db.from("assessments").update({ scores: scores as never, status: "scored" }).eq("id", row.id);
  if (error) throw new GatewayError("DB", error.message, 500);
  return { scores };
}

async function generateCertificate(db: DB, row: Row, stance: Stance, regenerate: boolean, userEmail: string) {
  if (row.certificate && row.certificate_hash && !regenerate) {
    return { certificate: row.certificate, hash: row.certificate_hash, reused: true };
  }
  const variants = (row.variants ?? []) as unknown as Variant[];
  const scores = (row.scores ?? []) as unknown as VariantScore[];
  const v = variants.find((x) => x.stance === stance);
  const sc = scores.find((x) => x.stance === stance);
  if (!v || !sc) throw new GatewayError("ORDER", "Generate and score variants first.", 409);
  const swaps = ((row.swaps ?? []) as unknown as Swap[]).filter((s) => s.stance === stance);
  const n = await structured(CertSchema, certificatePrompt(contextBlock(row), JSON.stringify(v), JSON.stringify(sc)));
  const stanceMeta = STANCES.find((s) => s.key === stance)!;
  const privacy = (row.privacy ?? {}) as PrivacyState;
  const issuedAt = new Date().toISOString();

  const log = {
    schema: "assayer.certificate/1",
    assessment_id: row.id,
    issued_at: issuedAt,
    sections: [
      {
        n: 1,
        title: "Identification",
        body: {
          provider: row.provider,
          unit: `${row.unit_code} ${row.unit_title}`,
          program: row.program,
          aqf_level: row.aqf_level,
          coordinator: row.coordinator,
          school: row.school,
          date: issuedAt.slice(0, 10),
          cohort_size: row.cohort_size,
          delivery_mode: row.delivery_mode,
        },
      },
      { n: 2, title: "Original Assessment Summary", body: { summary: n.original_summary, vulnerability_profile: n.vulnerability_profile } },
      {
        n: 3,
        title: "Redesign Rationale",
        body: {
          stance: stanceMeta.label,
          design_rule: stanceMeta.rule,
          aias_level: v.aias_level,
          rationale: n.redesign_rationale,
          teqsa_pathway: row.teqsa_pathway,
          pathway_served: n.pathway_served,
        },
      },
      {
        n: 4,
        title: "AI Tools and Systems Considered and Used",
        body: {
          model: AI_CONFIG.model,
          prompt_registry_version: PROMPT_VERSION,
          generation_date: issuedAt.slice(0, 10),
          passes: ["Pass 1: three-stance redesign", "Pass 2: Australian context localisation", "Adaptive capabilities scoring", "Certificate narrative"],
          localisation_swaps: swaps.map((s) => `${s.original} → ${s.replacement}`),
          guardrail_mapping: [
            "VAISS Guardrail 1 (accountability): unit coordinator is the named accountable human",
            "VAISS Guardrail 3 (data protection): privacy gate plus server-side anonymisation tripwire before any model call",
            "VAISS Guardrail 5 (human control): all outputs are drafts requiring academic acceptance",
            "VAISS Guardrail 6 (transparency): model, prompt version and swaps recorded in this log",
            "VAISS Guardrail 9 (records): canonicalised SHA-256 fingerprint",
            "AI6 practices: decide who is accountable; maintain human control; share essential information",
          ],
          human_decision_record: `Stance "${stanceMeta.label}" selected by ${userEmail} on ${issuedAt.slice(0, 10)}. The AI produced drafts; the academic retains decision authority (automated-decision transparency duties commencing 10 December 2026 under the Privacy Act).`,
        },
      },
      {
        n: 5,
        title: "Pedagogical Justification",
        body: { constructive_alignment: n.pedagogical_justification, maturity_self_rating: n.maturity_rating },
      },
      {
        n: 6,
        title: "Adaptive Capabilities and Employability Alignment Reasoning",
        body: { total: sc.total, out_of: 100, criteria: sc.criteria, employability: n.employability_reasoning, jsa_skills: n.jsa_skills },
      },
      { n: 7, title: "Standards and Frameworks Mapping", body: { rows: n.standards_mapping } },
      {
        n: 8,
        title: "Integrity, Fairness, Accessibility and Contestability",
        body: {
          privacy_gate: `Passed ${privacy.scanned_at?.slice(0, 10) ?? ""}: ${privacy.flags_total ?? 0} flag(s) raised, ${privacy.removed ?? 0} removed, ${(privacy.kept ?? []).length} kept with declaration. Server re-scan clean.`,
          integrity: n.integrity_fairness,
          equity_notes: n.equity_notes,
          accessibility_adjustments: n.accessibility_adjustments,
        },
      },
      {
        n: 9,
        title: "Declaration",
        body: {
          statement:
            "I declare that this redesign was reviewed by me, that no student personal information was processed, and that the standards listed are mapped to (not certified against) the named instruments.",
          prompt_registry_version: PROMPT_VERSION,
          signatures: ["Unit Coordinator", "Head of School or Associate Dean (Learning and Teaching)"],
          countersign_status: "Not yet countersigned",
          academic_board_routing: `Academic Board / academic governance committee — reference ${row.unit_code}-${issuedAt.slice(0, 10)}`,
        },
      },
    ],
  };
  const hash = await sha256Hex(canonicalize(log));
  const history = Array.isArray(row.certificate_history) ? [...(row.certificate_history as unknown[])] : [];
  if (row.certificate_hash) history.push({ superseded_hash: row.certificate_hash, superseded_at: issuedAt, replaced_by: hash });
  const { error } = await db
    .from("assessments")
    .update({
      certificate: log as never,
      certificate_hash: hash,
      certificate_history: history as never,
      selected_stance: stance,
      status: "certified",
    })
    .eq("id", row.id);
  if (error) throw new GatewayError("DB", error.message, 500);
  return { certificate: log, hash, reused: false };
}

export type GatewayTask = "generate_variants" | "context_pass" | "score_alignment" | "generate_certificate";

export async function runTask(
  task: GatewayTask,
  payload: { assessmentId: string; stance?: Stance | undefined; regenerate?: boolean | undefined },
  db: DB,
  userEmail: string,
) {
  const row = await loadRow(db, payload.assessmentId);
  tripwire(row); // before ANY model call
  switch (task) {
    case "generate_variants":
      return generateVariants(db, row);
    case "context_pass":
      return contextPass(db, row);
    case "score_alignment":
      return scoreAlignment(db, row);
    case "generate_certificate":
      return generateCertificate(db, row, payload.stance ?? "assisted", !!payload.regenerate, userEmail);
  }
}

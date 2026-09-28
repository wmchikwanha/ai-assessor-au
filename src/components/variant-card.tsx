import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { STANCES, type Swap, type Variant, type VariantScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone = {
  assisted: { bar: "bg-assisted", text: "text-assisted", ring: "stroke-assisted" },
  limited: { bar: "bg-limited", text: "text-limited", ring: "stroke-limited" },
  resistant: { bar: "bg-resistant", text: "text-resistant", ring: "stroke-resistant" },
} as const;

export function Gauge({ value, stance }: { value: number; stance: Variant["stance"] }) {
  const r = 52;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 128 76" className="w-40">
      <path d="M12 68 A52 52 0 0 1 116 68" fill="none" className="stroke-border" strokeWidth="10" />
      <path
        d="M12 68 A52 52 0 0 1 116 68"
        fill="none"
        className={tone[stance].ring}
        strokeWidth="10"
        strokeDasharray={`${(value / 100) * c} ${c}`}
      />
      <text x="64" y="62" textAnchor="middle" className="fill-foreground font-display" fontSize="26">{value}</text>
      <text x="64" y="74" textAnchor="middle" className="fill-muted-foreground" fontSize="8">/ 100</text>
    </svg>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-left hover:no-underline">
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-muted-foreground">{String(n).padStart(2, "0")}</span>
          <span className="font-display text-lg">{title}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm leading-relaxed">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function VariantCard({ v, score, swaps }: { v: Variant; score?: VariantScore; swaps: Swap[] }) {
  const meta = STANCES.find((s) => s.key === v.stance)!;
  const t = tone[v.stance];
  const totalMarks = v.rubric.reduce((a, r) => a + (Number(r.marks) || 0), 0);
  return (
    <article className="flex flex-col rounded-md border bg-paper shadow-sm">
      <div className={cn("h-1.5 rounded-t-md", t.bar)} />
      <header className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", t.text)}>{meta.label} · {meta.rule}</p>
            <h2 className="mt-2 text-2xl leading-tight">{v.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-sm border px-2 py-0.5 text-xs">{v.aias_level}</span>
              {swaps.length > 0 && (
                <span className="rounded-sm border border-gold bg-gold/15 px-2 py-0.5 text-xs text-gold-foreground" title={swaps.map((s) => `${s.original} → ${s.replacement}`).join("\n")}>
                  Localised · {swaps.length} swap{swaps.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {score && <Gauge value={score.total} stance={v.stance} />}
        </div>
      </header>

      <Accordion type="multiple" defaultValue={["Student-Facing Brief"]} className="px-6">
        <Section n={1} title="Student-Facing Brief">
          <p className="whitespace-pre-line">{v.student_brief}</p>
          <div className="rounded-sm bg-secondary/60 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mapped to course learning outcomes</p>
            <ul className="space-y-1">{v.clo_mapping.map((c) => <li key={c.clo}><strong>{c.clo}</strong> — {c.how}</li>)}</ul>
          </div>
        </Section>
        <Section n={2} title="AI-Use Conditions">
          <p className="font-medium">{v.aias_level}</p>
          <p className="whitespace-pre-line">{v.ai_use_conditions}</p>
        </Section>
        <Section n={3} title="Authenticity & Security Safeguards">
          <ul className="list-disc space-y-1 pl-5">{v.safeguards.map((s) => <li key={s}>{s}</li>)}</ul>
        </Section>
        <Section n={4} title="Marking Rubric">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1 pr-2">Criterion</th><th className="pr-2">CLO</th><th className="pr-2">High Distinction</th><th className="pr-2">Pass</th><th className="text-right">Marks</th></tr>
              </thead>
              <tbody>
                {v.rubric.map((r) => (
                  <tr key={r.criterion} className="border-t align-top">
                    <td className="py-2 pr-2"><strong>{r.criterion}</strong><br /><span className="text-muted-foreground">{r.description}</span></td>
                    <td className="pr-2 font-mono">{r.clo}</td>
                    <td className="pr-2">{r.high_standard}</td>
                    <td className="pr-2">{r.pass_standard}</td>
                    <td className="text-right font-mono">{r.marks}</td>
                  </tr>
                ))}
                <tr className="border-t font-semibold"><td colSpan={4} className="py-2">Total</td><td className="text-right font-mono">{totalMarks}</td></tr>
              </tbody>
            </table>
          </div>
        </Section>
        <Section n={5} title="Process Evidence Kit">
          <p className="text-muted-foreground">A first-class part of the submission: the judgement itself becomes assessable.</p>
          {v.process_evidence_kit.map((p) => (
            <div key={p.artefact} className="rounded-sm border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{p.artefact}</p>
                <span className="rounded-sm bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">Evidences: {p.capability}</span>
              </div>
              <p className="mt-1">{p.specification}</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-sm bg-secondary/60 p-2 font-mono text-[11px]">{p.template}</pre>
            </div>
          ))}
        </Section>
        <Section n={6} title="Australian Context Anchors">
          <ul className="space-y-1">{v.context_anchors.map((a) => <li key={a.anchor}><strong>{a.anchor}</strong> — {a.use}</li>)}</ul>
          {swaps.length > 0 && (
            <div className="rounded-sm border border-gold/50 bg-gold/10 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em]">Swap list</p>
              <ul className="space-y-1 text-xs">{swaps.map((s, i) => <li key={i}>{s.original} → <strong>{s.replacement}</strong> <span className="text-muted-foreground">({s.source})</span></li>)}</ul>
            </div>
          )}
        </Section>
        <Section n={7} title="Feasibility Notes">
          <p className="whitespace-pre-line">{v.feasibility_notes}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {v.feasibility.marking_minutes_per_student} min/student · {v.feasibility.total_marking_hours} marking hours · {v.feasibility.sessional_note}
          </p>
        </Section>
        {score && (
          <Section n={8} title="Adaptive Capabilities Alignment">
            {score.criteria.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs"><span className="font-medium">{c.name}</span><span className="font-mono">{c.score}/20</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-border"><div className={cn("h-1.5 rounded-full", t.bar)} style={{ width: `${(c.score / 20) * 100}%` }} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{c.justification}</p>
              </div>
            ))}
          </Section>
        )}
      </Accordion>
    </article>
  );
}

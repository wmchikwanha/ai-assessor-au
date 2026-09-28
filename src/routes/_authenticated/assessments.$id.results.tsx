import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { VariantCard } from "@/components/variant-card";
import { assessmentQuery } from "@/lib/assessments";
import { aiGateway } from "@/lib/ai/gateway.functions";
import { STANCES, type Stance, type Swap, type Variant, type VariantScore } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/assessments/$id/results")({
  beforeLoad: async ({ params }) => {
    const { data } = await supabase.from("assessments").select("privacy_cleared").eq("id", params.id).single();
    if (!data?.privacy_cleared) throw redirect({ to: "/assessments/$id/anonymise", params });
  },
  head: () => ({
    meta: [
      { title: "Three-stance results — Assayer" },
      { name: "description", content: "AI-Assisted, AI-Limited and AI-Resistant redesigns with process evidence and alignment scores." },
      { property: "og:title", content: "Three-stance results — Assayer" },
      { property: "og:description", content: "AI-Assisted, AI-Limited and AI-Resistant redesigns with process evidence and alignment scores." },
    ],
  }),
  component: Results,
});

function Results() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useServerFn(aiGateway);
  const { data: row } = useQuery(assessmentQuery(id));
  const [busy, setBusy] = useState<Stance | null>(null);

  if (!row) return <AppShell step={3}><p className="text-muted-foreground">Loading…</p></AppShell>;
  const variants = (row.variants ?? []) as unknown as Variant[];
  const scores = (row.scores ?? []) as unknown as VariantScore[];
  const swaps = (row.swaps ?? []) as unknown as Swap[];
  const verify = variants.flatMap((v) => v.verify_items.map((x) => ({ ...x, stance: v.stance })));

  if (!variants.length || !scores.length) {
    return (
      <AppShell step={3}>
        <p>The assay has not finished yet.</p>
        <Button asChild className="mt-4"><Link to="/assessments/$id/processing" params={{ id }}>Run the assay</Link></Button>
      </AppShell>
    );
  }

  async function certify(stance: Stance) {
    setBusy(stance);
    try {
      await run({ data: { task: "generate_certificate", payload: { assessmentId: id, stance, regenerate: !!row?.certificate && row?.selected_stance !== stance } } });
      await qc.invalidateQueries({ queryKey: ["assessment", id] });
      navigate({ to: "/assessments/$id/certificate", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell step={3}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Step 4 · Results · {row.unit_code}</Eyebrow>
          <h1 className="mt-2 text-4xl">{row.title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Three redesigns of the same assessment, each in a fixed structure. Scores are deliberately strict — competent redesigns land between 50 and 80.</p>
        </div>
        {row.certificate && <Button asChild variant="outline"><Link to="/assessments/$id/certificate" params={{ id }}>View filed certificate</Link></Button>}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {STANCES.map((s) => {
          const v = variants.find((x) => x.stance === s.key);
          if (!v) return null;
          return (
            <div key={s.key} className="flex flex-col gap-3">
              <VariantCard v={v} score={scores.find((x) => x.stance === s.key)} swaps={swaps.filter((x) => x.stance === s.key)} />
              <Button onClick={() => certify(s.key)} disabled={!!busy} variant={row.selected_stance === s.key ? "default" : "outline"}>
                {busy === s.key ? "Drafting certificate…" : row.selected_stance === s.key ? `Certified stance · open certificate` : `Select ${s.label} and certify`}
              </Button>
            </div>
          );
        })}
      </div>

      <section className="mt-12 rounded-md border bg-paper p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">[VERIFY] register</h2>
          <p className="font-mono text-xs text-muted-foreground">Data shelf last checked: 28 Sep 2026</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Figures and policy dates the model was not certain of. Confirm each before release to students.</p>
        {verify.length === 0 ? (
          <p className="mt-4 text-sm">No uncertain figures were flagged.</p>
        ) : (
          <ul className="mt-4 divide-y text-sm">
            {verify.map((x, i) => (
              <li key={i} className="flex gap-4 py-2">
                <span className="w-28 shrink-0 text-xs uppercase tracking-[0.1em] text-muted-foreground">{STANCES.find((s) => s.key === x.stance)?.label}</span>
                <span><strong>{x.claim}</strong> — {x.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

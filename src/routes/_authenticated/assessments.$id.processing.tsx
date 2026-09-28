import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { aiGateway } from "@/lib/ai/gateway.functions";

export const Route = createFileRoute("/_authenticated/assessments/$id/processing")({
  // Route guard: the privacy gate cannot be bypassed by navigation.
  beforeLoad: async ({ params }) => {
    const { data } = await supabase.from("assessments").select("privacy_cleared,status").eq("id", params.id).single();
    if (!data?.privacy_cleared) throw redirect({ to: "/assessments/$id/anonymise", params });
    return { status: data.status };
  },
  head: () => ({
    meta: [
      { title: "Running the assay — Assayer" },
      { name: "description", content: "Two-pass redesign, Australian localisation and adaptive capabilities scoring." },
      { property: "og:title", content: "Running the assay — Assayer" },
      { property: "og:description", content: "Two-pass redesign, Australian localisation and adaptive capabilities scoring." },
    ],
  }),
  component: Processing,
});

const PASSES = [
  { task: "generate_variants", label: "Pass 1 — Three-stance redesign", note: "AI-Assisted, AI-Limited and AI-Resistant versions with Process Evidence Kits" },
  { task: "context_pass", label: "Pass 2 — Australian context", note: "Swapping generic overseas examples for verified Australian anchors" },
  { task: "score_alignment", label: "Adaptive Capabilities scoring", note: "Strict 5 × 20 alignment with written justifications" },
] as const;

const ORDER = ["draft", "drafted", "localised", "scored"];

function Processing() {
  const { id } = Route.useParams();
  const { status } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const run = useServerFn(aiGateway);
  const startAt = Math.max(0, ORDER.indexOf(status));
  const [done, setDone] = useState(startAt >= 3 ? 3 : startAt);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function go(from: number) {
    setError(null);
    for (let i = from; i < PASSES.length; i++) {
      try {
        await run({ data: { task: PASSES[i].task, payload: { assessmentId: id } } });
        setDone(i + 1);
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    }
    await qc.invalidateQueries({ queryKey: ["assessment", id] });
    navigate({ to: "/assessments/$id/results", params: { id } });
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (done >= 3) navigate({ to: "/assessments/$id/results", params: { id } });
    else void go(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell step={2}>
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Step 3 · Assay</Eyebrow>
        <h1 className="mt-2 text-4xl">Assaying your assessment</h1>
        <p className="mt-2 text-muted-foreground">Every call passes through one audited AI gateway, which re-scans for personal information before any model is contacted. This usually takes one to three minutes.</p>
        <ol className="mt-10 space-y-4">
          {PASSES.map((p, i) => {
            const state = i < done ? "done" : i === done ? (error ? "error" : "running") : "waiting";
            return (
              <li key={p.task} className="flex gap-4 rounded-md border bg-paper p-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border">
                  {state === "done" && <Check className="h-4 w-4 text-assisted" />}
                  {state === "running" && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
                  {state === "error" && <X className="h-4 w-4 text-seal" />}
                  {state === "waiting" && <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>}
                </span>
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-sm text-muted-foreground">{p.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {error && (
          <div className="mt-6 rounded-md border border-seal/40 bg-seal/10 p-4 text-sm">
            <p className="font-medium text-seal">{error}</p>
            <Button className="mt-3" size="sm" onClick={() => go(done)}>Try this step again</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { DECISION_LABEL, ReviewerGate } from "@/components/review";
import { supabase } from "@/integrations/supabase/client";
import { STANCES, type VariantScore } from "@/lib/types";

export const Route = createFileRoute("/review/")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Governance Review Portal — Assayer" },
      { name: "description", content: "Reviewer dashboard for three-stance redesigns, alignment scores and assay certificates." },
      { property: "og:title", content: "Governance Review Portal — Assayer" },
      { property: "og:description", content: "Reviewer dashboard for three-stance redesigns, alignment scores and assay certificates." },
    ],
  }),
  component: ReviewDashboard,
});

function ReviewDashboard() {
  const { data: rows } = useQuery({
    queryKey: ["review-list"],
    queryFn: async () => {
      const [a, r] = await Promise.all([
        supabase.from("assessments").select("id,title,unit_code,status,scores,certificate_hash,selected_stance,updated_at").order("updated_at", { ascending: false }),
        supabase.from("assessment_reviews").select("assessment_id,kind,decision,created_at").order("created_at", { ascending: true }),
      ]);
      if (a.error) throw a.error;
      if (r.error) throw r.error;
      return (a.data ?? []).map((x) => {
        const mine = (r.data ?? []).filter((y) => y.assessment_id === x.id);
        const last = [...mine].reverse().find((y) => y.kind === "decision");
        return { ...x, notes: mine.filter((y) => y.kind === "comment").length, decision: last?.decision ?? null };
      });
    },
  });
  const pending = rows?.filter((r) => !r.decision).length ?? 0;

  return (
    <AppShell>
      <ReviewerGate>
        <Eyebrow>Governance review portal</Eyebrow>
        <h1 className="mt-2 text-4xl">Assessments for review</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Open any assessment to read its three redesigns, alignment scores and filed certificate, add review notes and record a decision. Notes and decisions are append-only.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[["Assessments", rows?.length ?? 0], ["Awaiting decision", pending], ["Decided", (rows?.length ?? 0) - pending]].map(([l, v]) => (
            <div key={l as string} className="rounded-md border bg-paper p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{l}</p>
              <p className="mt-2 font-display text-4xl">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-x-auto rounded-md border bg-paper">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/60 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Unit</th><th className="px-5 py-3">Assessment</th><th className="px-5 py-3">Best alignment</th>
                <th className="px-5 py-3">Certificate</th><th className="px-5 py-3">Notes</th><th className="px-5 py-3">Decision</th><th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {!rows && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {rows?.map((a) => {
                const scores = (a.scores ?? []) as unknown as VariantScore[];
                const best = scores.length ? scores.reduce((m, s) => (s.total > m.total ? s : m)) : null;
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-5 py-4 font-mono text-xs">{a.unit_code}</td>
                    <td className="px-5 py-4">{a.title}</td>
                    <td className="px-5 py-4">{best ? `${best.total}/100 · ${STANCES.find((s) => s.key === best.stance)?.label}` : "Not scored"}</td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{a.certificate_hash ? a.certificate_hash.slice(0, 12) : "—"}</td>
                    <td className="px-5 py-4">{a.notes}</td>
                    <td className="px-5 py-4"><span className="rounded-sm border px-2 py-0.5 text-xs">{a.decision ? DECISION_LABEL[a.decision] : "Pending"}</span></td>
                    <td className="px-5 py-4 text-right"><Button asChild size="sm" variant="outline"><Link to="/review/$id" params={{ id: a.id }}>Review</Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ReviewerGate>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { VariantCard } from "@/components/variant-card";
import { DECISION_LABEL, ReviewerGate } from "@/components/review";
import { supabase } from "@/integrations/supabase/client";
import { assessmentQuery } from "@/lib/assessments";
import { useRole } from "@/lib/role";
import { STANCES, type Swap, type Variant, type VariantScore } from "@/lib/types";

export const Route = createFileRoute("/review/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Assessment review — Assayer" },
      { name: "description", content: "Review three redesigns, alignment scoring and the assay certificate, then record a decision." },
      { property: "og:title", content: "Assessment review — Assayer" },
      { property: "og:description", content: "Review three redesigns, alignment scoring and the assay certificate, then record a decision." },
    ],
  }),
  component: ReviewDetail,
});

type Section = { n: number; title: string };

function ReviewDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { name, setName, role } = useRole();
  const { data: row } = useQuery(assessmentQuery(id));
  const reviewsKey = ["reviews", id];
  const { data: reviews } = useQuery({
    queryKey: reviewsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("assessment_reviews").select("*").eq("assessment_id", id).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [body, setBody] = useState("");
  const [stance, setStance] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(kind: "comment" | "decision", decision?: "approved" | "returned") {
    if (kind === "comment" && !body.trim()) return toast.error("Write a note first.");
    if (kind === "decision" && decision === "returned" && !body.trim()) return toast.error("Explain what needs revision in the note box.");
    setBusy(true);
    const { error } = await supabase.from("assessment_reviews").insert({
      assessment_id: id, kind, decision: decision ?? null, stance: stance || null, body: body.trim(),
      reviewer_name: `${name.trim() || "Reviewer"} (${role})`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    toast.success(kind === "decision" ? "Decision recorded." : "Note added.");
    qc.invalidateQueries({ queryKey: reviewsKey });
    qc.invalidateQueries({ queryKey: ["review-list"] });
  }

  const variants = (row?.variants ?? []) as unknown as Variant[];
  const scores = (row?.scores ?? []) as unknown as VariantScore[];
  const swaps = (row?.swaps ?? []) as unknown as Swap[];
  const cert = row?.certificate as unknown as { issued_at?: string; sections?: Section[] } | null;
  const lastDecision = [...(reviews ?? [])].reverse().find((r) => r.kind === "decision");

  return (
    <AppShell>
      <ReviewerGate>
        {!row ? <p className="text-muted-foreground">Loading…</p> : (
          <>
            <Link to="/review" className="text-sm text-muted-foreground hover:text-foreground">← All assessments</Link>
            <Eyebrow>Governance review · {row.unit_code}</Eyebrow>
            <h1 className="mt-2 text-4xl">{row.title}</h1>
            <p className="mt-2 text-muted-foreground">{row.unit_title} · {row.program} · AQF {row.aqf_level} · {row.cohort_size} students · {row.delivery_mode}</p>
            <p className="mt-3"><span className="rounded-sm border px-2 py-0.5 text-xs">Current decision: {lastDecision?.decision ? DECISION_LABEL[lastDecision.decision] : "Pending"}</span></p>

            <section className="mt-10">
              <h2 className="text-2xl">Three variants and scoring</h2>
              {variants.length ? (
                <>
                  <div className="mt-4 overflow-x-auto rounded-md border bg-paper">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-secondary/60 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        <tr><th className="px-4 py-2">Criterion</th>{STANCES.map((s) => <th key={s.key} className="px-4 py-2">{s.label}</th>)}</tr>
                      </thead>
                      <tbody>
                        {(scores[0]?.criteria ?? []).map((c, i) => (
                          <tr key={c.name} className="border-b">
                            <td className="px-4 py-2">{c.name}</td>
                            {STANCES.map((s) => <td key={s.key} className="px-4 py-2 font-mono">{scores.find((x) => x.stance === s.key)?.criteria[i]?.score ?? "—"}/20</td>)}
                          </tr>
                        ))}
                        <tr className="font-semibold"><td className="px-4 py-2">Total</td>{STANCES.map((s) => <td key={s.key} className="px-4 py-2 font-mono">{scores.find((x) => x.stance === s.key)?.total ?? "—"}/100</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 grid gap-6 xl:grid-cols-3">
                    {STANCES.map((s) => {
                      const v = variants.find((x) => x.stance === s.key);
                      return v ? <VariantCard key={s.key} v={v} score={scores.find((x) => x.stance === s.key)} swaps={swaps.filter((x) => x.stance === s.key)} /> : null;
                    })}
                  </div>
                </>
              ) : <p className="mt-3 rounded-md border bg-paper p-5 text-muted-foreground">The assay has not been run for this assessment yet, so there are no variants or scores to review.</p>}
            </section>

            <section className="mt-10 rounded-md border bg-paper p-6">
              <h2 className="text-2xl">Assay certificate</h2>
              {cert && row.certificate_hash ? (
                <>
                  <p className="mt-2 text-sm">Certified stance: <strong>{STANCES.find((s) => s.key === row.selected_stance)?.label ?? row.selected_stance}</strong>{cert.issued_at && <> · issued {new Date(cert.issued_at).toLocaleString("en-AU")}</>}</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">SHA-256 {row.certificate_hash}</p>
                  <ol className="mt-4 grid gap-1 text-sm sm:grid-cols-2">{cert.sections?.map((s) => <li key={s.n}>§{s.n} {s.title}</li>)}</ol>
                  <Button asChild variant="outline" className="mt-4"><Link to="/assessments/$id/certificate" params={{ id }}>Open full certificate and verify hash</Link></Button>
                </>
              ) : <p className="mt-2 text-muted-foreground">No certificate has been filed yet.</p>}
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-md border bg-paper p-6">
                <h2 className="text-2xl">Add a note or decision</h2>
                <label className="mt-4 block text-sm">Fictional reviewer alias (optional)
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sandbox Reviewer A — not your real name" className="mt-1 w-full rounded-sm border bg-background px-3 py-2" />
                </label>
                <label className="mt-3 block text-sm">About which variant (optional)
                  <select value={stance} onChange={(e) => setStance(e.target.value)} className="mt-1 w-full rounded-sm border bg-background px-3 py-2">
                    <option value="">Whole assessment</option>
                    {STANCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
                <label className="mt-3 block text-sm">Note
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-sm border bg-background px-3 py-2" />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => add("comment")}>Add note</Button>
                  <Button disabled={busy} onClick={() => add("decision", "approved")}>Approve</Button>
                  <Button variant="destructive" disabled={busy} onClick={() => add("decision", "returned")}>Return for revision</Button>
                </div>
              </div>
              <div className="rounded-md border bg-paper p-6">
                <h2 className="text-2xl">Review trail</h2>
                {!reviews?.length ? <p className="mt-3 text-muted-foreground">No notes or decisions yet.</p> : (
                  <ul className="mt-4 space-y-3 text-sm">
                    {reviews.map((r) => (
                      <li key={r.id} className="border-l-2 border-gold pl-3">
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-AU")} · {r.reviewer_name}{r.stance && ` · ${STANCES.find((s) => s.key === r.stance)?.label}`}</p>
                        {r.kind === "decision" && <p className="font-semibold">{DECISION_LABEL[r.decision ?? ""]}</p>}
                        {r.body && <p className="whitespace-pre-line">{r.body}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </ReviewerGate>
    </AppShell>
  );
}

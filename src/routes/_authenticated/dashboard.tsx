import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { assessmentsListQuery, nextStepFor } from "@/lib/assessments";
import { STANCES, type VariantScore } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Assayer" },
      { name: "description", content: "Your assessment assays, redesigns and certificates." },
      { property: "og:title", content: "Dashboard — Assayer" },
      { property: "og:description", content: "Your assessment assays, redesigns and certificates." },
    ],
  }),
  component: Dashboard,
});

const STATUS: Record<string, string> = {
  draft: "Captured",
  drafted: "Redesigned",
  localised: "Localised",
  scored: "Scored",
  certified: "Certified",
};

function Dashboard() {
  const { data, isLoading } = useQuery(assessmentsListQuery);
  const certified = data?.filter((a) => a.status === "certified").length ?? 0;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Workbench</Eyebrow>
          <h1 className="mt-2 text-4xl">Your assays</h1>
        </div>
        <Button asChild size="lg"><Link to="/assessments/new">New assay</Link></Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Assessments captured", data?.length ?? 0],
          ["Certificates filed", certified],
          ["In progress", (data?.length ?? 0) - certified],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-md border bg-paper p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{l}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-hidden rounded-md border bg-paper">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/60 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Unit</th>
              <th className="px-5 py-3">Assessment</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Best alignment</th>
              <th className="px-5 py-3">Hash</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center">
                  <p className="font-display text-xl">No assessments yet.</p>
                  <p className="mt-1 text-muted-foreground">Start with the demo loader — a real Australian case report assessment.</p>
                  <Button asChild className="mt-4"><Link to="/assessments/new" search={{ demo: true }}>Load the demo assessment</Link></Button>
                </td>
              </tr>
            )}
            {data?.map((a) => {
              const step = nextStepFor(a);
              const scores = (a.scores ?? []) as unknown as VariantScore[];
              const best = scores.length ? scores.reduce((m, s) => (s.total > m.total ? s : m)) : null;
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-5 py-4 font-mono text-xs">{a.unit_code}</td>
                  <td className="px-5 py-4">{a.title}</td>
                  <td className="px-5 py-4"><span className="rounded-sm border px-2 py-0.5 text-xs">{STATUS[a.status] ?? a.status}</span></td>
                  <td className="px-5 py-4">{best ? `${best.total}/100 · ${STANCES.find((s) => s.key === best.stance)?.label}` : "—"}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{a.certificate_hash ? a.certificate_hash.slice(0, 12) : "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <Button asChild size="sm" variant="outline"><Link to={step.to} params={{ id: a.id }}>{step.label}</Link></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

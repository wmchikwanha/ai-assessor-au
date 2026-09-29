import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, AssayStamp, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { assessmentQuery } from "@/lib/assessments";
import { aiGateway } from "@/lib/ai/gateway.functions";
import { canonicalize, sha256Hex } from "@/lib/canonical";
import type { Stance } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/assessments/$id/certificate")({
  head: () => ({
    meta: [
      { title: "Assay Certificate — Assayer" },
      { name: "description", content: "Nine-section Faculty AI Governance Log with SHA-256 fingerprint." },
      { property: "og:title", content: "Assay Certificate — Assayer" },
      { property: "og:description", content: "Nine-section Faculty AI Governance Log with SHA-256 fingerprint." },
    ],
  }),
  component: Certificate,
});

type Section = { n: number; title: string; body: Record<string, unknown> };
type Log = { issued_at: string; sections: Section[] };

const human = (k: string) => k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function Value({ v }: { v: unknown }) {
  if (Array.isArray(v)) {
    if (v.length && typeof v[0] === "object") {
      const keys = Object.keys(v[0] as object);
      return (
        <table className="mt-1 w-full text-xs">
          <thead><tr className="text-left text-muted-foreground">{keys.map((k) => <th key={k} className="py-1 pr-3 font-medium">{human(k)}</th>)}</tr></thead>
          <tbody>
            {v.map((row, i) => (
              <tr key={i} className="border-t align-top">
                {keys.map((k) => {
                  const cell = String((row as Record<string, unknown>)[k] ?? "");
                  const pending = k === "status" && cell.toLowerCase().includes("pending");
                  return <td key={k} className={`py-1.5 pr-3 ${pending ? "text-limited" : ""}`}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return <ul className="list-disc space-y-0.5 pl-5">{v.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>;
  }
  return <span className="whitespace-pre-line">{String(v ?? "—")}</span>;
}

function Certificate() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const run = useServerFn(aiGateway);
  const { data: row } = useQuery(assessmentQuery(id));
  const [verified, setVerified] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  if (!row) return <AppShell step={4}><p className="text-muted-foreground">Loading…</p></AppShell>;
  if (!row.certificate || !row.certificate_hash) {
    return (
      <AppShell step={4}>
        <p>No certificate has been filed yet.</p>
        <Button asChild className="mt-4"><Link to="/assessments/$id/results" params={{ id }}>Choose a stance</Link></Button>
      </AppShell>
    );
  }
  const log = row.certificate as unknown as Log;
  const hash = row.certificate_hash;
  const history = (row.certificate_history ?? []) as { superseded_hash: string; superseded_at: string }[];

  async function verify() {
    const h = await sha256Hex(canonicalize(row!.certificate));
    setVerified(h === hash);
  }

  async function regenerate() {
    if (!confirm("Regenerate replaces this log and records the supersession. Continue?")) return;
    setBusy(true);
    try {
      await run({ data: { task: "generate_certificate", payload: { assessmentId: id, stance: (row!.selected_stance ?? "assisted") as Stance, regenerate: true } } });
      await qc.invalidateQueries({ queryKey: ["assessment", id] });
      setVerified(null);
      toast.success("Certificate regenerated and re-hashed.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell step={4}>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Step 5 · Assay Certificate</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={verify}>Verify hash in browser</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>Print / save as PDF</Button>
          <Button variant="outline" size="sm" onClick={regenerate} disabled={busy}>{busy ? "Regenerating…" : "Regenerate"}</Button>
          <Button asChild size="sm"><Link to="/assessments/$id/results" params={{ id }}>Back to results</Link></Button>
        </div>
      </div>
      {verified !== null && (
        <div className={`no-print mb-6 rounded-md border p-3 text-sm ${verified ? "border-assisted/40 bg-assisted/10" : "border-seal/40 bg-seal/10"}`}>
          {verified ? "Independent re-computation of the canonical JSON matches the stored SHA-256 fingerprint." : "Hash mismatch — this log has been altered since it was stamped."}
        </div>
      )}

      <article className="print-sheet mx-auto max-w-4xl rounded-sm border bg-paper px-10 py-12 shadow-md md:px-16">
        <header className="flex items-start justify-between gap-6 border-b-2 border-double border-foreground/30 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{row.provider || "Australian higher education provider"}</p>
            <h1 className="mt-3 text-4xl">Assay Certificate</h1>
            <p className="font-display text-lg italic text-muted-foreground">Faculty AI Governance Log</p>
            <p className="mt-3 text-sm">{row.unit_code} {row.unit_title} · {row.title}</p>
          </div>
          <div className="flex flex-col items-center text-seal">
            <AssayStamp className="h-20 w-20" />
            <p className="mt-2 font-mono text-xs">{hash.slice(0, 12)}</p>
          </div>
        </header>

        <div className="mt-8 space-y-8">
          {log.sections.map((s) => (
            <section key={s.n}>
              <h2 className="flex items-baseline gap-3 text-xl">
                <span className="font-mono text-sm text-gold-foreground/70">§{s.n}</span>{s.title}
              </h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm md:grid-cols-[200px_1fr]">
                {Object.entries(s.body).map(([k, v]) => {
                  if (k === "criteria" && Array.isArray(v)) {
                    return (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">Criteria (5 × 20)</dt>
                        <dd><Value v={(v as { name: string; score: number; justification: string }[]).map((c) => ({ criterion: c.name, score: `${c.score}/20`, justification: c.justification }))} /></dd>
                      </div>
                    );
                  }
                  return (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{human(k)}</dt>
                      <dd><Value v={v} /></dd>
                    </div>
                  );
                })}
              </dl>
              {s.n === 9 && (
                <div className="mt-8 grid gap-10 md:grid-cols-2">
                  {["Unit Coordinator", "Head of School or Associate Dean (Learning and Teaching)"].map((sig) => (
                    <div key={sig}>
                      <div className="h-12 border-b border-foreground/40" />
                      <p className="mt-1 text-xs">{sig}</p>
                      <p className="text-xs text-muted-foreground">Date: ____ / ____ / ________</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t pt-4 text-[11px] text-muted-foreground">
          <p>Issued {new Date(log.issued_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })} (AEST/AEDT). Standards are mapped to, not certified against, the instruments named.</p>
          <p className="mt-1 break-all font-mono">SHA-256 (canonical key-sorted JSON): {hash}</p>
          <p className="mt-2">Developed by Walter C. Copyright 2026.</p>
          {history.length > 0 && (
            <div className="mt-2">
              <p>Supersession record:</p>
              <ul className="font-mono">{history.map((h) => <li key={h.superseded_hash}>{h.superseded_hash.slice(0, 12)}… superseded {h.superseded_at.slice(0, 10)}</li>)}</ul>
            </div>
          )}
        </footer>
      </article>
    </AppShell>
  );
}

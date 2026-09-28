import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { assessmentQuery } from "@/lib/assessments";
import { CATEGORY_LABEL, removeFlag, scanText, type PrivacyFlag } from "@/lib/privacy-scan";

export const Route = createFileRoute("/_authenticated/assessments/$id/anonymise")({
  head: () => ({
    meta: [
      { title: "Privacy gate — Assayer" },
      { name: "description", content: "Remove Australian personal information before any AI processing." },
      { property: "og:title", content: "Privacy gate — Assayer" },
      { property: "og:description", content: "Remove Australian personal information before any AI processing." },
    ],
  }),
  component: PrivacyGate,
});

const DECLARATIONS = [
  "No student personal information remains in this text.",
  "Any remaining names are staff or author names, included with consent.",
  "I understand generation is blocked until this text is clean.",
];

function PrivacyGate() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: row } = useQuery(assessmentQuery(id));
  const [text, setText] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const [removed, setRemoved] = useState(0);
  const [decl, setDecl] = useState([false, false, false]);
  const [initialCount, setInitialCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (row && text === null) {
      setText(row.original_text);
      setInitialCount(scanText(row.original_text).length);
    }
  }, [row, text]);

  const flags = useMemo(() => (text ? scanText(text).filter((f) => !(f.category === "name" && kept.includes(f.text))) : []), [text, kept]);
  const clean = flags.length === 0;
  const canContinue = clean && decl.every(Boolean);

  async function proceed() {
    if (!canContinue || text === null) return;
    setBusy(true);
    const { error } = await supabase
      .from("assessments")
      .update({
        clean_text: text,
        privacy_cleared: true,
        privacy: { flags_total: initialCount, removed, kept, declarations: decl, scanned_at: new Date().toISOString() },
      })
      .eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["assessment", id] });
    navigate({ to: "/assessments/$id/processing", params: { id } });
  }

  if (!row || text === null) return <AppShell step={1}><p className="text-muted-foreground">Loading…</p></AppShell>;

  return (
    <AppShell step={1}>
      <Eyebrow>Step 2 · Privacy gate</Eyebrow>
      <h1 className="mt-2 text-4xl">Nothing reaches a model until this text is clean</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Handling of personal information is governed by the <em>Privacy Act 1988</em> (Cth) — in particular APP 6 (use and
        disclosure) and APP 11 (security) — and the Notifiable Data Breaches scheme. Assayer scans in your browser for
        Australian identifiers, and the server re-scans independently before any AI call.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border bg-paper p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Assessment text</h2>
          <Highlighted text={text} flags={flags} />
        </section>

        <aside className="space-y-6">
          <div className={`flex items-center gap-3 rounded-md border p-4 ${clean ? "border-assisted/40 bg-assisted/10" : "border-seal/40 bg-seal/10"}`}>
            {clean ? <ShieldCheck className="h-6 w-6 text-assisted" /> : <ShieldAlert className="h-6 w-6 text-seal" />}
            <div>
              <p className="font-medium">{clean ? "No unresolved personal information" : `${flags.length} item(s) require action`}</p>
              <p className="text-xs text-muted-foreground">{initialCount} flagged on first scan · {removed} removed · {kept.length} kept with declaration</p>
            </div>
          </div>

          <ul className="space-y-3">
            {flags.map((f) => (
              <li key={f.id} className="rounded-md border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{CATEGORY_LABEL[f.category]}</p>
                <p className="mt-1 break-all font-mono text-sm">{f.text}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => { setText((t) => removeFlag(t!, f)); setRemoved((n) => n + 1); }}>Remove</Button>
                  {f.category === "name" ? (
                    <Button size="sm" variant="outline" onClick={() => { setKept((k) => [...k, f.text]); setDecl((d) => [d[0], false, d[2]]); }}>
                      Keep (staff name, with declaration)
                    </Button>
                  ) : (
                    <span className="self-center text-xs text-muted-foreground">Identifiers must be removed.</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-3 rounded-md border bg-paper p-5">
            <p className="text-sm font-semibold">Declarations</p>
            {DECLARATIONS.map((d, i) => (
              <label key={d} className="flex items-start gap-3 text-sm">
                <Checkbox checked={decl[i]} onCheckedChange={(v) => setDecl((p) => p.map((x, j) => (j === i ? !!v : x)))} className="mt-0.5" />
                <span>{d}</span>
              </label>
            ))}
            <Button className="mt-2 w-full" size="lg" disabled={!canContinue || busy} onClick={proceed}>
              {busy ? "Saving…" : "Continue to assay"}
            </Button>
            {!canContinue && <p className="text-xs text-muted-foreground">Continue unlocks when every flag is removed or kept with a declaration, and all three declarations are ticked.</p>}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Highlighted({ text, flags }: { text: string; flags: PrivacyFlag[] }) {
  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const f of flags) {
    parts.push(text.slice(i, f.start));
    parts.push(
      <mark key={f.id} className="rounded-sm bg-seal/15 px-0.5 text-seal ring-1 ring-seal/40" title={CATEGORY_LABEL[f.category]}>
        {f.text}
      </mark>,
    );
    i = f.end;
  }
  parts.push(text.slice(i));
  return <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{parts}</pre>;
}

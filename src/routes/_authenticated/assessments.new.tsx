import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_ASSESSMENT } from "@/lib/demo";
import { extractText } from "@/lib/extract";

export const Route = createFileRoute("/_authenticated/assessments/new")({
  validateSearch: z.object({ demo: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Capture an assessment — Assayer" },
      { name: "description", content: "Paste or upload an assessment and record its unit metadata." },
      { property: "og:title", content: "Capture an assessment — Assayer" },
      { property: "og:description", content: "Paste or upload an assessment and record its unit metadata." },
    ],
  }),
  component: Capture,
});

const empty = {
  title: "",
  provider: "",
  unit_code: "",
  unit_title: "",
  program: "",
  aqf_level: 7,
  discipline: "",
  cohort_size: 100,
  delivery_mode: "On campus",
  teqsa_pathway: "unit-level",
  coordinator: "",
  school: "",
  learning_outcomes: "",
  text: "",
};

function Capture() {
  const navigate = useNavigate();
  const { demo } = Route.useSearch();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (demo) setF(DEMO_ASSESSMENT);
  }, [demo]);

  async function onFile(file: File) {
    setExtracting(true);
    try {
      const text = await extractText(file);
      set("text", text);
      if (!f.title) set("title", file.name.replace(/\.[^.]+$/, ""));
      toast.success(`Extracted ${text.length.toLocaleString()} characters in your browser.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  async function save() {
    if (!f.text.trim() || !f.unit_code.trim()) { toast.error("Unit code and assessment text are required."); return; }
    setBusy(true);
    const { text, ...meta } = f;
    const { data, error } = await supabase
      .from("assessments")
      .insert({ ...meta, title: meta.title || `${meta.unit_code} assessment`, original_text: text, clean_text: text })
      .select("id")
      .single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/assessments/$id/anonymise", params: { id: data.id } });
  }

  return (
    <AppShell step={0}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Step 1 · Capture</Eyebrow>
          <h1 className="mt-2 text-4xl">Capture the assessment you already use</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Paste text or upload a PDF or Word file. Extraction happens in your browser — the file itself is never uploaded.</p>
        </div>
        <Button variant="outline" onClick={() => { setF(DEMO_ASSESSMENT); toast.success("Demo assessment loaded: BUSN2045 Case Report."); }}>
          Load demo assessment
        </Button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="text" className="text-base">Assessment text</Label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={extracting}>
                {extracting ? "Extracting…" : "Upload PDF / Word"}
              </Button>
            </div>
          </div>
          <Textarea id="text" value={f.text} onChange={(e) => set("text", e.target.value)} className="min-h-[520px] bg-paper font-mono text-[13px] leading-relaxed" placeholder="Paste the task description, instructions and marking criteria…" />
          <p className="text-xs text-muted-foreground">{f.text.length.toLocaleString()} characters</p>
        </section>

        <section className="space-y-4 rounded-md border bg-paper p-6">
          <h2 className="text-xl">Unit metadata</h2>
          <Field label="Assessment title"><Input value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit code *"><Input value={f.unit_code} onChange={(e) => set("unit_code", e.target.value.toUpperCase())} placeholder="BUSN2045" /></Field>
            <Field label="AQF level">
              <Select value={String(f.aqf_level)} onValueChange={(v) => set("aqf_level", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5, 6, 7, 8, 9, 10].map((l) => <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Unit title"><Input value={f.unit_title} onChange={(e) => set("unit_title", e.target.value)} /></Field>
          <Field label="Course / program"><Input value={f.program} onChange={(e) => set("program", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discipline"><Input value={f.discipline} onChange={(e) => set("discipline", e.target.value)} /></Field>
            <Field label="Cohort size"><Input type="number" value={f.cohort_size} onChange={(e) => set("cohort_size", Number(e.target.value))} /></Field>
          </div>
          <Field label="Delivery mode">
            <Select value={f.delivery_mode} onValueChange={(v) => set("delivery_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["On campus", "Online", "Blended (on campus + online)", "Multi-campus", "Work-integrated learning"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="TEQSA reform pathway">
            <Select value={f.teqsa_pathway} onValueChange={(v) => set("teqsa_pathway", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="program-wide">Program-wide reform</SelectItem>
                <SelectItem value="unit-level">Unit-level assurance</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Provider"><Input value={f.provider} onChange={(e) => set("provider", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit coordinator"><Input value={f.coordinator} onChange={(e) => set("coordinator", e.target.value)} /></Field>
            <Field label="School"><Input value={f.school} onChange={(e) => set("school", e.target.value)} /></Field>
          </div>
          <Field label="Course learning outcomes (one per line)">
            <Textarea value={f.learning_outcomes} onChange={(e) => set("learning_outcomes", e.target.value)} className="min-h-[110px] text-sm" />
          </Field>
          <Button className="w-full" size="lg" onClick={save} disabled={busy}>{busy ? "Saving…" : "Continue to privacy gate"}</Button>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

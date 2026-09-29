import { createFileRoute, Link } from "@tanstack/react-router";
import { AssayStamp, Wordmark, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { STANCES } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assayer — AI Assessment Governance Workbench for Australian Higher Education" },
      { name: "description", content: "Redesign the assessments you already own into AI-Assisted, AI-Limited and AI-Resistant versions, with process evidence, strict scoring and a hash-stamped Assay Certificate." },
      { property: "og:title", content: "Assayer — AI Assessment Governance Workbench" },
      { property: "og:description", content: "Assessment redesign for the age of AI, filed as hash-stamped governance evidence mapped to TEQSA, HESF 2021 and the ACSES Framework." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const stanceColour = { assisted: "bg-assisted", limited: "bg-limited", resistant: "bg-resistant" } as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark />
          <div className="flex items-center gap-3">
            <Link to="/guide" className="text-sm text-muted-foreground hover:text-foreground">Guide &amp; FAQ</Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Button asChild size="sm"><Link to="/auth">Open workbench</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Eyebrow>AI Assessment Governance Workbench · Australian higher education</Eyebrow>
          <h1 className="mt-5 text-5xl font-medium leading-[1.05] text-foreground md:text-6xl">
            Prove, assessment by assessment, that your unit still evidences learning.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Paste an assessment you already use. Assayer checks it for student personal information, redesigns it
            three ways, specifies the process evidence students must submit, scores it strictly against TEQSA's
            adaptive capabilities, and files a hash-stamped certificate your school can stand behind.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth">Begin an assay</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#how">How it works</a></Button>
          </div>
          <p className="mt-8 font-display text-base italic text-muted-foreground">
            "In the goldfields, the assayer was the one person whose stamp everyone trusted. On campus, that's you."
          </p>
        </div>

        <div className="relative rounded-md border bg-paper p-7 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assay Certificate</p>
              <p className="mt-1 font-display text-xl">BUSN2045 · Case Report</p>
            </div>
            <AssayStamp className="h-14 w-14 text-seal" />
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {["Identification", "Original Assessment Summary", "Redesign Rationale", "AI Tools and Systems", "Pedagogical Justification", "Adaptive Capabilities Alignment", "Standards and Frameworks Mapping", "Integrity, Fairness, Accessibility", "Declaration"].map((s, i) => (
              <div key={s} className="flex items-baseline gap-3 border-b border-dashed pb-2 last:border-0">
                <span className="font-mono text-xs text-gold-foreground/70">§{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-xs text-muted-foreground">SHA-256 · 9f2c41a07be3…</p>
        </div>
      </section>

      <section id="how" className="border-y bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow>Three stances, one task</Eyebrow>
          <h2 className="mt-3 text-3xl">Not a detector. A redesign, with the paperwork.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STANCES.map((s) => (
              <div key={s.key} className="rounded-md border bg-card p-6">
                <div className={`h-1 w-12 ${stanceColour[s.key]}`} />
                <h3 className="mt-4 text-2xl">{s.label}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{s.rule}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        {[
          ["Privacy gate", "Scans for Australian personal information — TFN, Medicare, ABN, phones, student IDs — before anything reaches a model. Privacy Act 1988 (Cth), APP 6 and 11."],
          ["Process Evidence Kit", "Drafts, prompts log, decision memo and feedback-response note — the judgement itself becomes assessable."],
          ["Strict 5 × 20 scoring", "Evaluative judgement, verification, metacognition, ethics, Australian context. Competent redesigns land between 50 and 80."],
          ["Assay Certificate", "Nine fixed sections mapped to HESF 2021, AQF, the ACSES Framework and AIAS, fingerprinted with SHA-256."],
        ].map(([t, d]) => (
          <div key={t}>
            <h3 className="text-xl">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          Assayer maps to — and does not certify compliance with — TEQSA guidance, HESF 2021, AQF and the ACSES Framework. Foundational build for academic review.
          <p className="mt-2"><Link to="/guide" className="hover:text-foreground">Guide &amp; FAQ</Link> · Developed by Walter C. Copyright 2026.</p>
        </div>
      </footer>
    </div>
  );
}

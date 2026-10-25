import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Scale, ShieldCheck, Fingerprint } from "lucide-react";
import { AssayStamp, Eyebrow, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CRITERIA } from "@/lib/types";

export const Route = createFileRoute("/ai-ethics")({
  head: () => ({
    meta: [
      { title: "AI Ethics & Transparent AI Policy — Assayer" },
      { name: "description", content: "How Assayer’s five capability criteria relate to ACSES and TEQSA, with transparent AI-use, privacy, equity and human-review boundaries." },
      { property: "og:title", content: "AI Ethics & Transparent AI Policy — Assayer" },
      { property: "og:description", content: "An explicit account of Assayer’s assessment rubric, framework mapping, AI processing and limits." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://ai-assessor-au.lovable.app/ai-ethics" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ai-assessor-au.lovable.app/ai-ethics" }],
  }),
  component: AIEthicsPage,
});

const mapping = [
  {
    acses: "Human-centred education and accountable use: people remain responsible for judging whether an AI contribution is appropriate, fair and useful.",
    teqsa: "Supports evaluative judgement and critical engagement with AI rather than treating fluent output as evidence of learning.",
    evidence: "A decision memo comparing AI suggestions, identifying weaknesses and explaining what was accepted, changed or rejected.",
    review: "Check that the student’s disciplinary judgement—not the tool’s confidence—is being assessed.",
  },
  {
    acses: "Transparency and accountability: make AI assistance and the basis of claims visible and open to scrutiny.",
    teqsa: "Supports critical evaluation and learning assurance through traceable claims and credible evidence; this is not a separate TEQSA capability label.",
    evidence: "A sources log, checked citations and a record of how factual claims were verified against authoritative material.",
    review: "Resolve every [VERIFY] flag; check that references exist and actually support the claim.",
  },
  {
    acses: "Human agency and adaptive skills: learners monitor their own learning and use AI deliberately rather than delegating responsibility.",
    teqsa: "Relates to metacognitive development and the 2026 emphasis on learning-process evidence and process-focused assessment.",
    evidence: "Planning notes, drafts, a prompts log, revision decisions and a feedback-response reflection.",
    review: "Require proportionate evidence of learning; do not equate more logs with deeper understanding or create unnecessary surveillance.",
  },
  {
    acses: "Fairness, accountability, transparency and contestability; inclusive implementation and ethical development and deployment.",
    teqsa: "Relates to ethical reasoning and responsible AI use alongside credible assurance of learning.",
    evidence: "A reasoned account of privacy, consent, bias, access, disclosure and the consequences of AI use for affected people.",
    review: "Provide accessible alternatives and a human route to question decisions; do not make access to paid AI a hidden prerequisite.",
  },
  {
    acses: "Inclusive, human-centred implementation and respect for Indigenous knowledges, with equity for diverse student groups at the centre.",
    teqsa: "Applies learning assurance and adaptive capability development to disciplinary and situated practice; the Australian-context criterion is Assayer’s own.",
    evidence: "A locally grounded application, verified Australian sources and an explanation suited to the intended professional or community audience.",
    review: "Check cultural authority, accessibility and local relevance. Australian terminology alone does not establish meaningful contextual judgement.",
  },
] as const;

const policy = [
  ["What AI does", "Assayer uses generative AI to draft AI-Assisted, AI-Limited and AI-Resistant assessment redesigns, suggest Australian contextual replacements, score drafts against its five criteria and draft narrative content for the Assay Certificate. These are review materials, not automated academic approvals or student grades."],
  ["What stays with people", "Academic staff choose the stance, check learning outcomes and sources, assess feasibility and equity, and seek the required institutional review. Assayer does not detect AI-written text, infer student authorship, decide misconduct or replace authorised academic judgement."],
  ["What is sent for AI processing", "After privacy clearance, AI prompts can contain the cleaned assessment text, learning outcomes, provider and unit/program metadata, AQF level, discipline, cohort size, delivery mode and reform pathway. Later steps can also include generated drafts, scores and relevant Australian context anchors. Review all submitted fields, not just the assessment text."],
  ["What is saved before the privacy gate", "PDF and Word text extraction happens in the browser; the source file itself is not uploaded by the capture flow. Saving an assessment does store its extracted or pasted original text and metadata in Lovable Cloud before privacy review. Redacting the AI copy does not erase that original record. Use synthetic or already de-identified material in this prototype."],
  ["Privacy checks and their limits", "The browser flags selected Australian identifiers and possible names. The server independently checks the cleaned text and selected fields before AI requests and blocks unresolved flags. Staff or author names may be retained with declarations. Pattern checks can miss indirect identification and sensitive context; clearance is not a guarantee of anonymity or permission to disclose."],
  ["AI service and model transparency", "Model requests pass through Assayer’s single server-side AI gateway to the Lovable AI Gateway. Generated records capture a model identifier and prompt version; consult the relevant record and the certificate’s AI Tools and Systems section when reviewing an output. Model configuration can change, and this page is not a guarantee of downstream provider behaviour."],
  ["Retention, training and location", "Requests ask for store: false. That setting does not establish the gateway’s or downstream provider’s retention, training use, processing location or contractual protections. Assessment records retain original and cleaned text, privacy declarations, drafts, scores and certificate history. No automatic retention period or verified provider deletion assurance is established here; application-log retention is also unverified. Institutional review of service terms is required before sensitive use."],
  ["Accuracy, bias and cultural authority", "AI can invent citations, misstate policy, reproduce bias or overlook accessibility needs. Verify factual and regulatory claims, review language and workload, and check local institutional policy. Assayer’s prompts prohibit inventing Indigenous knowledge content; inclusion requires appropriate Aboriginal and Torres Strait Islander authority and protocols, not model-generated substitutes."],
  ["Records are not endorsements", "Certificates preserve a point-in-time governance record with a canonical SHA-256 fingerprint, model and prompt-version information. Explicit regeneration records supersession. A hash can reveal changed data; it cannot prove that claims are true, reviewers approved them or student learning has been assured."],
] as const;

const sources = [
  ["ACSES · 2025", "Australian Framework for Artificial Intelligence in Higher Education", "https://www.acses.edu.au/publication/australian-framework-for-artificial-intelligence-in-higher-education/"],
  ["TEQSA · 2023", "Assessment reform for the age of artificial intelligence", "https://www.teqsa.gov.au/guides-resources/resources/corporate-publications/assessment-reform-age-artificial-intelligence"],
  ["TEQSA · 2025", "Enacting assessment reform in a time of artificial intelligence", "https://www.teqsa.gov.au/guides-resources/resources/corporate-publications/enacting-assessment-reform-time-artificial-intelligence"],
  ["TEQSA · 2026", "Assuring quality learning in a gen AI-integrated future: The role of adaptive capabilities", "https://www.teqsa.gov.au/guides-resources/resources/corporate-publications/assuring-quality-learning-gen-ai-integrated-future-role-adaptive-capabilities"],
] as const;

function AIEthicsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Wordmark />
          <nav className="flex flex-wrap items-center gap-4 text-sm" aria-label="Primary navigation">
            <Link to="/guide" className="text-muted-foreground hover:text-foreground">Guide &amp; FAQ</Link>
            <Link to="/ai-ethics" aria-current="page" className="font-medium">AI Ethics</Link>
            <Button asChild size="sm"><Link to="/dashboard">Open workbench</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1fr_auto] md:py-16">
            <div className="max-w-3xl">
              <Eyebrow>Assayer · Principles &amp; accountability</Eyebrow>
              <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">AI Ethics</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Human judgement at the centre. Equity in the design. AI use open to scrutiny.</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">How Assayer’s five capability criteria relate to ACSES and TEQSA—and what our prototype does, stores and cannot promise.</p>
              <p className="mt-6 border-l-2 border-seal pl-4 text-sm text-seal">Prototype for academic review; not piloted, evaluated or institutionally endorsed.</p>
              <p className="mt-4 font-mono text-xs text-muted-foreground">Policy version 1.0 · Reviewed 23 October 2026</p>
            </div>
            <AssayStamp className="hidden h-28 w-28 self-center text-gold md:block" />
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside>
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm lg:sticky lg:top-6 lg:flex-col lg:border-l lg:pl-4" aria-label="AI Ethics contents">
              <a href="#frameworks" className="text-muted-foreground hover:text-foreground">Frameworks &amp; scope</a>
              <a href="#criteria" className="text-muted-foreground hover:text-foreground">Five-criteria mapping</a>
              <a href="#policy" className="text-muted-foreground hover:text-foreground">Transparent AI policy</a>
              <a href="#review" className="text-muted-foreground hover:text-foreground">Academic review</a>
              <a href="#sources" className="text-muted-foreground hover:text-foreground">Source references</a>
            </nav>
          </aside>

          <div className="min-w-0 space-y-14">
            <section id="frameworks" className="scroll-mt-6">
              <Scale className="h-7 w-7 text-gold-foreground" aria-hidden />
              <h2 className="mt-3 text-3xl">Related frameworks, different roles</h2>
              <div className="mt-6 grid gap-7 sm:grid-cols-2">
                <div className="border-t-2 border-assisted pt-4">
                  <h3 className="text-2xl">ACSES: ethics and equity</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">The Australian Framework for Artificial Intelligence in Higher Education (2025) sets sector principles for ethical, equitable and effective AI use. Equity for diverse student groups is central. It largely leaves assessment to TEQSA guidance; Assayer records how a redesign relates to its ethics and equity principles.</p>
                </div>
                <div className="border-t-2 border-primary pt-4">
                  <h3 className="text-2xl">TEQSA: assessment and learning</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">TEQSA’s assessment reform resources address trustworthy evidence of learning alongside responsible AI use. The 2026 resource develops adaptive capabilities and process-focused assessment. Assayer draws on that direction; it does not implement an official TEQSA scoring instrument.</p>
                </div>
              </div>
              <p className="mt-7 border-y py-5 text-sm leading-relaxed text-muted-foreground">The mapping below is Assayer’s interpretive crosswalk, not an official equivalence, accreditation or endorsement. Assayer’s five criteria are its own rubric, not TEQSA’s four adaptive capabilities. Each contributes up to 20 points; scores are uncalibrated decision support, not a validated measure of learning or institutional approval.</p>
            </section>

            <section id="criteria" className="scroll-mt-6">
              <Eyebrow>Capability Criteria Alignment</Eyebrow>
              <h2 className="mt-3 text-3xl">Five criteria, visible evidence</h2>
              <div className="mt-7 divide-y border-y">
                {mapping.map((item, index) => (
                  <article key={CRITERIA[index]} className="py-7">
                    <div className="flex items-start gap-4">
                      <span className="shrink-0 font-mono text-sm text-gold-foreground">0{index + 1}</span>
                      <h3 className="text-2xl">{CRITERIA[index]}</h3>
                    </div>
                    <dl className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-[100px_1fr]">
                      <dt className="font-medium text-assisted">ACSES link</dt><dd className="text-muted-foreground">{item.acses}</dd>
                      <dt className="font-medium text-primary">TEQSA link</dt><dd className="text-muted-foreground">{item.teqsa}</dd>
                      <dt className="font-medium">Evidence</dt><dd className="text-muted-foreground">{item.evidence}</dd>
                      <dt className="font-medium text-seal">Review check</dt><dd className="text-muted-foreground">{item.review}</dd>
                    </dl>
                  </article>
                ))}
              </div>
            </section>

            <section id="policy" className="scroll-mt-6">
              <ShieldCheck className="h-7 w-7 text-assisted" aria-hidden />
              <h2 className="mt-3 text-3xl">Transparent AI policy</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">This describes the current prototype’s workflow and its limits. Review it alongside institutional policy and the terms of the services used; it is not a substitute for a privacy or procurement assessment.</p>
              <dl className="mt-7 divide-y border-y">
                {policy.map(([title, text]) => (
                  <div key={title} className="py-5">
                    <dt className="font-display text-xl">{title}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="review" className="scroll-mt-6">
              <Fingerprint className="h-7 w-7 text-seal" aria-hidden />
              <h2 className="mt-3 text-3xl">Before an assessment reaches students</h2>
              <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Check outcomes, claims, sources, marking rubrics and every [VERIFY] item with an authorised academic.</li>
                <li>Make permitted AI use, disclosure and process evidence explicit in the student-facing brief.</li>
                <li>Review cost, device access, disability adjustments, language needs and fair alternatives with the relevant institutional services.</li>
                <li>Keep evidence requirements proportionate and explain how students can seek clarification or contest an assessment decision through existing institutional processes.</li>
                <li>Record unresolved risks and obtain required unit, program or school approval. A generated declaration is not evidence that approval occurred.</li>
              </ul>
            </section>

            <section id="sources" className="scroll-mt-6 border-t pt-8">
              <Eyebrow>Primary references</Eyebrow>
              <h2 className="mt-3 text-3xl">Read the guidance in context</h2>
              <ul className="mt-6 divide-y">
                {sources.map(([label, title, url]) => (
                  <li key={url} className="py-4">
                    <p className="mb-1 font-mono text-xs text-muted-foreground">{label}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-sm text-primary underline underline-offset-4 hover:text-foreground">{title}<ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0" aria-label="Opens in a new tab" /></a>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">This page summarises relationships rather than reproducing framework wording. Sources and institutional requirements may change; revisit the mapping when guidance, tools or assessment conditions change.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-7 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>Prototype for academic review; not piloted, evaluated or institutionally endorsed.<br />Developed by Walter C. Copyright 2026.</p>
          <nav className="flex gap-5" aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/guide">Guide &amp; FAQ</Link></nav>
        </div>
      </footer>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  HelpCircle,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Wordmark, Eyebrow } from "@/components/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide & FAQ — Assayer" },
      {
        name: "description",
        content: "A practical guide to assessment redesign, privacy review, AI-use stances, scoring and Assay Certificates in Australian higher education.",
      },
      { property: "og:title", content: "Assayer Guide & FAQ" },
      {
        property: "og:description",
        content: "Understand every step of the Assayer assessment governance workflow, from capture to certificate.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://ai-assessor-au.lovable.app/guide" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ai-assessor-au.lovable.app/guide" }],
  }),
  component: GuidePage,
});

const contents = [
  ["start", "Start here"],
  ["workflow", "The five-step workflow"],
  ["stances", "AI-use stances"],
  ["evidence", "Evidence and scoring"],
  ["certificate", "Assay Certificate"],
  ["governance", "Governance glossary"],
  ["faq", "Frequently asked questions"],
] as const;

const workflow = [
  {
    number: "01",
    title: "Capture",
    text: "Paste an existing assessment or upload its document, then record the unit, program, AQF level, discipline, cohort, delivery mode and TEQSA reform pathway.",
  },
  {
    number: "02",
    title: "Privacy gate",
    text: "Review possible personal information before any model call. Replace flagged details with neutral tokens and confirm that the clean text is safe to use.",
  },
  {
    number: "03",
    title: "Assay",
    text: "Generate three structured redesigns, apply Australian context anchors and assess each redesign against five adaptive capabilities.",
  },
  {
    number: "04",
    title: "Results",
    text: "Compare the three stances, process evidence, safeguards, marking rubrics, contextual anchors, feasibility notes and alignment scores.",
  },
  {
    number: "05",
    title: "Certificate",
    text: "Select the defensible redesign and file a nine-section governance record with a canonical SHA-256 fingerprint.",
  },
] as const;

const faqGroups = [
  {
    category: "Using Assayer",
    items: [
      ["What should I enter first?", "Begin with an assessment that already exists. Use the student-facing brief and rubric rather than a high-level description, then check the metadata before continuing."],
      ["Can I use the sample assessments?", "Yes. The sample records are synthetic and are intended to demonstrate the complete journey without using real student or staff information."],
      ["Can I upload a PDF or Word document?", "Yes. Text is extracted in your browser so you can review it before capture. Layout, images, tables and tracked changes may not transfer perfectly, so compare the extracted text with the source."],
      ["Can I change a generated redesign?", "Treat every result as a review draft. Academic staff remain responsible for checking learning outcomes, rubric language, workload, accessibility, policy references and factual claims before use."],
    ],
  },
  {
    category: "Privacy and responsible use",
    items: [
      ["What does the privacy gate look for?", "It flags common Australian identifiers and contact details, including email addresses, phone numbers, TFNs, Medicare numbers, ABNs, student IDs, dates of birth, addresses and possible names."],
      ["Does a clear privacy screen guarantee that no personal information remains?", "No. Pattern matching cannot recognise every context or identifier. Read the entire clean-text preview and remove any detail that could identify a student, staff member or third party."],
      ["What should never be entered?", "Do not enter real student submissions, health information, case files, unpublished research data, confidential workplace material, passwords or information you are not authorised to disclose."],
      ["How should Indigenous knowledges or contexts be handled?", "Assayer does not invent this content. Any inclusion should follow institutional protocols and be developed with the appropriate Aboriginal and Torres Strait Islander authority, community or knowledge holder."],
    ],
  },
  {
    category: "Results and decisions",
    items: [
      ["Which stance should I choose?", "There is no universally best stance. Choose the option that fits the learning outcomes, disciplinary practice, risk, student preparation, available supervision and the unit’s place in the program."],
      ["What does a score out of 100 mean?", "It is a structured comparison across evaluative judgement, verification, metacognition, ethics and Australian context. Each criterion contributes up to 20 points. It is decision support, not a quality guarantee."],
      ["Why are strong-looking redesigns not scored near 100?", "The scoring is deliberately strict. A credible, workable redesign will commonly sit between 50 and 80 because uncertainty, implementation constraints and trade-offs remain."],
      ["What does [VERIFY] mean?", "The statement needs a human to confirm it against an authoritative source. Replace or resolve every flag before approving or distributing an assessment."],
      ["Does Assayer detect whether a student used AI?", "No. It redesigns assessment and documents governance decisions. It does not infer authorship or provide AI-text detection."],
    ],
  },
  {
    category: "Certificates and governance",
    items: [
      ["What does the Assay Certificate prove?", "It records the source assessment, selected redesign, reasoning, AI-use conditions, pedagogical justification, standards mapping, safeguards and declaration at a point in time. It does not replace institutional approval."],
      ["What is the certificate hash?", "It is a SHA-256 fingerprint calculated from the certificate’s canonical, key-sorted data. If that data changes, the fingerprint changes, making later alteration visible."],
      ["Why is certificate regeneration explicit?", "A filed governance record should not silently change. Regeneration creates a deliberate supersession event so the history of the record remains visible."],
      ["Does framework mapping constitute institutional approval?", "No. Mapping shows where the redesign relates to named standards and guidance. Final decisions remain with the authorised academic and institutional governance processes."],
      ["When should an assay be revisited?", "Review it when learning outcomes, delivery mode, cohort, assessment weighting, institutional policy, available AI systems or relevant external guidance changes."],
    ],
  },
] as const;

function GuidePage() {
  const [query, setQuery] = useState("");
  const filteredGroups = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-AU");
    if (!term) return faqGroups;
    return faqGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(([question, answer]) => `${question} ${answer}`.toLocaleLowerCase("en-AU").includes(term)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);
  const resultCount = filteredGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Wordmark />
          <nav className="flex items-center gap-5 text-sm" aria-label="Primary navigation">
            <Link to="/guide" className="font-medium text-foreground">Guide & FAQ</Link>
            <Button asChild size="sm"><Link to="/dashboard">Open workbench</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section id="start" className="border-b bg-primary text-primary-foreground scroll-mt-6">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Reference desk · Australian higher education</p>
              <h1 className="mt-4 text-5xl font-medium leading-tight sm:text-6xl">Guide &amp; FAQ</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
                A practical reference for moving from an existing assessment to a defensible redesign and a filed governance record.
              </p>
              <div className="relative mt-8 max-w-xl text-foreground">
                <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the FAQ"
                  aria-label="Search the FAQ"
                  className="h-11 bg-paper pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-6 border-l pl-5" aria-label="Guide contents">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
              <ul className="space-y-2.5 text-sm">
                {contents.map(([id, label]) => (
                  <li key={id}><a href={`#${id}`} className="text-muted-foreground hover:text-foreground">{label}</a></li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-20">
            <section id="workflow" className="scroll-mt-6">
              <Eyebrow>The core journey</Eyebrow>
              <h2 className="mt-3 text-4xl">From source assessment to filed record</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
                Assayer supports academic judgement; it does not replace it. Each stage creates material for review, and no generated output should be issued to students without an authorised academic decision.
              </p>
              <ol className="mt-8 border-t">
                {workflow.map((step) => (
                  <li key={step.number} className="grid gap-3 border-b py-6 sm:grid-cols-[64px_180px_1fr] sm:gap-6">
                    <span className="font-mono text-sm text-gold-foreground">{step.number}</span>
                    <h3 className="text-xl">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="stances" className="scroll-mt-6">
              <Eyebrow>Three design positions</Eyebrow>
              <h2 className="mt-3 text-4xl">Choose the role AI should play</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {[
                  ["border-assisted", "AI-Assisted", "AI is intentionally part of learning and assessment. Students disclose and critically evaluate its use; judgement and verification remain visible."],
                  ["border-limited", "AI-Limited", "AI is permitted only for named stages or purposes. Boundaries, evidence and consequences are explicit in the student-facing brief."],
                  ["border-resistant", "AI-Resistant", "The task depends on situated performance, supervised production, oral defence or unique process evidence that generic output cannot readily substitute."],
                ].map(([colour, title, text]) => (
                  <article key={title} className={`border-t-4 ${colour} bg-paper p-6`}>
                    <h3 className="text-2xl">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </article>
                ))}
              </div>
              <div className="mt-8 grid gap-6 border-y py-7 sm:grid-cols-[180px_1fr]">
                <h3 className="text-xl">AIAS labels</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The AI Assessment Scale label communicates the permitted level of AI use. Read it together with the detailed conditions: the number alone cannot express tool limits, disclosure requirements, process evidence or discipline-specific expectations.
                </p>
              </div>
            </section>

            <section id="evidence" className="scroll-mt-6">
              <Eyebrow>What makes a redesign defensible</Eyebrow>
              <h2 className="mt-3 text-4xl">Evidence, not surveillance</h2>
              <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {[
                  [FileCheck2, "Process Evidence Kit", "Drafts, a prompts log, decision memo and feedback-response note show how judgement developed—not merely what was submitted."],
                  [ShieldCheck, "Authenticity safeguards", "Task-specific evidence, checkpoints, oral explanation and contextual decisions strengthen confidence without relying on AI-text detection."],
                  [CheckCircle2, "Five × 20 scoring", "Evaluative judgement, verification, metacognition, ethics and Australian context are each scored out of 20."],
                  [Sparkles, "Context anchors", "Australian regulatory, professional and workplace references are suggested as review prompts. Factual claims marked [VERIFY] require confirmation."],
                ].map(([Icon, title, text]) => {
                  const ItemIcon = Icon as typeof FileCheck2;
                  return (
                    <article key={title as string} className="grid grid-cols-[36px_1fr] gap-3">
                      <ItemIcon className="mt-0.5 h-6 w-6 text-gold-foreground" aria-hidden />
                      <div>
                        <h3 className="text-xl">{title as string}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text as string}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section id="certificate" className="scroll-mt-6">
              <div className="border bg-paper p-6 sm:p-9">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <Eyebrow>Governance record</Eyebrow>
                    <h2 className="mt-3 text-4xl">The Assay Certificate</h2>
                  </div>
                  <Fingerprint className="h-12 w-12 shrink-0 text-seal" aria-hidden />
                </div>
                <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
                  The certificate is a point-in-time record of the decision and its basis. Its nine fixed sections make the reasoning reviewable across a unit, program or school.
                </p>
                <ol className="mt-7 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  {[
                    "Identification",
                    "Original Assessment Summary",
                    "Redesign Rationale",
                    "AI Tools and Systems",
                    "Pedagogical Justification",
                    "Adaptive Capabilities Alignment",
                    "Standards and Frameworks Mapping",
                    "Integrity, Fairness and Accessibility",
                    "Declaration",
                  ].map((section, index) => (
                    <li key={section} className="flex gap-3 border-b border-dashed py-2">
                      <span className="font-mono text-xs text-gold-foreground">§{index + 1}</span>
                      <span>{section}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7 flex gap-3 border-l-2 border-seal pl-4 text-sm leading-relaxed text-muted-foreground">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-seal" aria-hidden />
                  <p>The hash reveals whether filed certificate data has changed. It does not validate the truth of a claim or provide institutional approval.</p>
                </div>
              </div>
            </section>

            <section id="governance" className="scroll-mt-6">
              <Eyebrow>Governance glossary</Eyebrow>
              <h2 className="mt-3 text-4xl">Frameworks referenced in an assay</h2>
              <dl className="mt-7 divide-y border-y">
                {[
                  ["TEQSA reform pathway", "Records whether redesign is situated at program-wide, unit-level or hybrid reform. It helps reviewers see the intended governance context."],
                  ["HESF 2021", "The Higher Education Standards Framework provides threshold standards for Australian higher education providers. Assayer records relevant mapping for review."],
                  ["AQF", "The Australian Qualifications Framework informs expected complexity, autonomy and learning outcomes at the nominated qualification level."],
                  ["ACSES Framework", "A sector framework for assessment reform in the age of generative AI, including the development of students’ capacity to work critically and ethically with AI."],
                  ["AIAS", "The AI Assessment Scale communicates the expected level of AI use in an assessment. Local institutional policy and the full task conditions remain authoritative."],
                ].map(([term, definition]) => (
                  <div key={term} className="grid gap-2 py-5 sm:grid-cols-[190px_1fr] sm:gap-8">
                    <dt className="font-medium">{term}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{definition}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="faq" className="scroll-mt-6">
              <div className="flex items-end justify-between gap-5 border-b pb-5">
                <div>
                  <Eyebrow>Reference questions</Eyebrow>
                  <h2 className="mt-3 text-4xl">Frequently asked questions</h2>
                </div>
                <HelpCircle className="hidden h-9 w-9 text-gold-foreground sm:block" aria-hidden />
              </div>

              {filteredGroups.length ? (
                <div className="mt-8 space-y-10">
                  {filteredGroups.map((group) => (
                    <div key={group.category}>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.category}</h3>
                      <Accordion type="multiple" className="mt-2">
                        {group.items.map(([question, answer]) => (
                          <AccordionItem key={question} value={question}>
                            <AccordionTrigger className="text-base no-underline hover:no-underline">{question}</AccordionTrigger>
                            <AccordionContent className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
                  <p className="mt-3 font-display text-xl">No matching questions</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a broader term such as privacy, score or certificate.</p>
                </div>
              )}
              {query && filteredGroups.length > 0 && <p className="mt-6 text-xs text-muted-foreground">{resultCount} matching {resultCount === 1 ? "question" : "questions"}</p>}
            </section>

            <section className="border-t pt-10">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-3xl">Ready to apply the guide?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Start with a synthetic sample or capture an assessment you are authorised to review.</p>
                </div>
                <Button asChild size="lg"><Link to="/dashboard">Open workbench</Link></Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Assayer supports evidence-informed academic judgement. Institutional policy remains authoritative.</p>
          <div className="flex gap-4"><Link to="/">Home</Link><Link to="/dashboard">Workbench</Link></div>
        </div>
      </footer>
    </div>
  );
}
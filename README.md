# Academic Assessment Hub

have a good read, and plan accordingly so we do this as super efficiently as possible. i would prefer to kit it out with the most usable foundational, sufficiently demonstrable for academia to get a very good grasp and idea before putting in all the bells and whistles. please use your wisdom to plan it out and build accordingly. we will need to have an academically appealing theme

Build Assayer, the AI Assessment Governance Workbench for Australian higher education, as described in the attached product document and staged build plan. Build the foundational, core-journey version first (Stages 0-6 of the attached plan): landing shell with an academically credible governance theme, authenticated dashboard, Capture (paste or upload, client-side text extraction, metadata form with unit code, program, AQF level, discipline, cohort size, delivery mode, TEQSA pathway), Privacy gate / anonymisation screen, the AI choke point as a single server function exposing generate_variants, score_alignment, generate_certificate and context_pass, Three-stance generation results screen (AI-Assisted / AI-Limited / AI-Resistant cards in the fixed structure: Student-Facing Brief mapped to course learning outcomes, AI-Use Conditions with AIAS level label, Authenticity & Security Safeguards, Marking Rubric, Australian Context Anchors, Feasibility Notes), Process Evidence Kit per variant, Adaptive Capabilities Alignment scoring (strict 5x20), and the Assay Certificate view with the nine-section governance log and SHA-256 canonicalised hash. Include the demo loader with a real sample Australian assessment so the whole journey is demonstrable without real data. Defer later-stage features (distribution exports, roles/countersign/oversight dashboard, content depth, hardening) to subsequent stages. Please provide a screenshot of the finished app.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ai-assessor-au.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/46b2af7b-c320-4d8f-ac59-ba33f4e170e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

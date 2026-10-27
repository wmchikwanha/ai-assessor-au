<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All model calls go through `aiGateway` in src/lib/ai/gateway.functions.ts ({task, payload}); pages never import the AI SDK — one auditable door.
- Model name/endpoint live only in src/lib/ai/config.server.ts; prompts only in prompts.server.ts with PROMPT_VERSION — swaps and audits are one-file changes.
- src/lib/privacy-scan.ts is shared by browser gate and server tripwire — one definition of personal information.
- Certificates are hashed server-side over canonical key-sorted JSON (src/lib/canonical.ts) and persisted once; regenerate is explicit and recorded in certificate_history.
- Workbench pages live under the ungated `_sandbox` layout (ssr:false for browser-driven capture and privacy navigation); `/auth` only redirects to `/dashboard`, so integration-managed authentication cannot re-lock the evaluation journey.
- Sandbox AI actions use a handler-created publishable client under public RLS, never an admin client or identity check; CSRF and the shared privacy tripwire stay enabled to protect the anonymous evaluation flow.
- The comprehensive Guide & FAQ is a standalone public `/guide` route so it can be shared without entering the workbench.
- AI ethics and AI-handling disclosures live on the public `/ai-ethics` route; use shared capability labels and distinguish interpretive framework mapping from official equivalence so public policy remains auditable.
- The governance review portal is public `/review` routes locked in the UI by a self-selectable test role (src/lib/role.ts); review notes/decisions are append-only rows in assessment_reviews so the review trail stays auditable. Real role security needs auth + user_roles later.

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
- Authenticated pages live under src/routes/_authenticated (ssr:false gate) and read data with the browser client under RLS.
- The comprehensive Guide & FAQ is a standalone public `/guide` route so it can be shared without entering the workbench.

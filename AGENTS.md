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
- Audience reactions are computed server-side in POST /api/speech (Gemini via Lovable AI Gateway, streamed then parsed); the browser only maps interest scores to poses — keeps prompts and keys off the client.
- Practice mode and audience size live in the /practice URL search params, set by the landing pop-up — the room has no controls to change them.
- Audience cast generation and balanced seat indexing live in the browser-safe audience look module, so rendering and seating-rule tests share the same logic.
- Practice URL validation accepts out-of-range values; the shared practice search helpers normalize them before rendering, so old links cannot blank the page.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project source of truth

Before implementing features, check the relevant project docs:

- Product requirements: `docs/PRD.md`
- Architecture: `docs/Tech.md`
- Database schema: `docs/DB.md`
- UI rules: `docs/UI-rules.md`

Rules:

- Do not invent product requirements that are not in PRD/SoW.
- Follow the architecture/tech docs before introducing new patterns.
- Follow the database schema before creating or changing tables.
- Follow the UI-rules specified in `docs/UI-rules.md` as well as here before building UI

## Supabase MCP

- Whenever I ask you to do something related to Supabase you must know that you have MCP connection to my Supabase project. Do not ever leave SQL or any other actions for user to complete, you do it yourself. Only let user know if you can't accomplish a certain task using MCP.

## UI: shadcn/ui with preset `b7kBsBkh7b`

This project's UI is built with shadcn/ui using preset `b7kBsBkh7b`. Its settings live in `components.json` (style `base-nova`, base color `zinc`, Remix icons, `inverted-translucent` menus, pointer cursor on buttons). Use it everywhere:

- Add components with `npx shadcn@latest add <name>` or the shadcn MCP server. Don't hand-write or copy components from elsewhere when a registry component exists.
- Never re-run `shadcn init` with a different preset or style, and don't edit the theme settings in `components.json`. If init must be re-run, use `npx shadcn@latest init --preset b7kBsBkh7b --template next --pointer`.
- Icons: use `@remixicon/react` only. Lucide is intentionally not installed.
- Class merging: import `cn` from `@/lib/utils` (it wraps shadcn's `cn` package). Don't add `clsx` or `tailwind-merge`.
- Theme colors and fonts come from the CSS variables in `app/globals.css`. Use the semantic tokens (`bg-primary`, `text-muted-foreground`, etc.), not hardcoded colors.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

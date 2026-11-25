# UI rules for this project

- When adding components use MCP to check what’s available and to pull the latest.
- Always check for the shadcn preset and use preset from components.json
- Always use shadcn/ui components and patterns for UI when possible.
- Prefer existing components from "@/components/ui/*" before creating custom UI.
- Follow ui.shadcn.com component structure, composition, and naming.
- Do not invent custom button, input, dialog, select, table, or form primitives if shadcn/ui already provides them.
- Keep styling in Tailwind CSS.
- Reuse shadcn variants instead of writing ad-hoc styles.
- For forms, prefer shadcn form patterns and accessible labels/errors.
- Before adding a new UI primitive, check whether shadcn/ui already has that component.

## Theme

- Dark is the default UI. A first visit is dark even when the OS prefers light; the OS preference is never used.
- Users switch between Dark and Light with the animated sun/moon button in the app header, left of the avatar (`components/ui/animated-theme-toggle.tsx`, from 21st.dev, built on the shadcn `Button` and `motion`). The choice is saved per browser (next-themes, `localStorage` key `theme`), not on the account.
- Every web page follows the theme: the app, auth pages, the marketing page and the public pay page. The public pages have no switch of their own and use whatever the browser has stored (dark by default).
- Invoice emails and PDFs always stay light.
- Use the semantic tokens from `app/globals.css` (`bg-background`, `text-muted-foreground`, etc.). They have light (`:root`) and dark (`.dark`) values from the shadcn preset, so don't hardcode colors or add `dark:` overrides unless a token can't express it.

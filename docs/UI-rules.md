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
- Every web page follows the theme: the app, auth pages, the marketing page and the public pay page. The public pages (including the marketing footer) have no switch of their own and use whatever the browser has stored (dark by default).
- Invoice emails and PDFs always stay light.
- `--success` / `--success-foreground` (`text-success`, `bg-success/10`, …) mark positive changes, such as a rising trend on the dashboard. Don't use them for status badges; those keep the variants in Tech.md §12.
- Marketing page exceptions: the sticky header, the hero, and the Why Payable, Product, Features, Pricing and FAQ sections, the footer and the legal placeholder pages (`components/marketing/marketing-nav.tsx`, `hero.tsx`, `why-payable.tsx`, `product.tsx`, `features.tsx`, `pricing.tsx`, `faq.tsx`, `footer.tsx`, `legal-placeholder.tsx`) are always dark, whatever the stored theme (a `dark` class on each). Primary buttons on the landing page are white (`whiteButton` from `components/marketing/button-styles.ts`) instead of lime; the app keeps lime.
- Use the semantic tokens from `app/globals.css` (`bg-background`, `text-muted-foreground`, etc.). They have light (`:root`) and dark (`.dark`) values from the shadcn preset, so don't hardcode colors or add `dark:` overrides unless a token can't express it.

## Landing page motion

- Landing sections enter with a slight fade up, one block at a time, never element by element: a heading with its eyebrow and text is one block, each card is one block, a visual is one block.
- Scroll reveals use `Reveal` (`components/marketing/reveal.tsx`): rise 40px, fade in and sharpen from an 8px blur over 0.8s, once, starting when the block is 10% of the screen height above the bottom edge. `FeatureCard` uses the same `revealMotion`. Stagger siblings in a row with `delay` (0, 0.08, 0.16).
- The hero animates on page load with the CSS `animate-fade-up` utility (`app/globals.css`), so it doesn't wait for hydration: text block first, product window 150ms later.
- The footer doesn't fade in. With reduced motion, everything simply shows.

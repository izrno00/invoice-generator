"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

/**
 * Theme for every web page (UI-rules.md "Theme"). Dark is the default for a first visit,
 * and the OS preference is never used. Users can switch to Light from the avatar menu.
 * The choice is stored per browser in localStorage under `theme`.
 *
 * next-themes renders an inline script that sets the `dark` class on <html> before the
 * first paint, so there's no flash. On the client the script is rendered as `text/plain`,
 * which stops React 19 warning about a <script> tag rendered by a component
 * (see the Next.js guide "Preventing flash before hydration").
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      scriptProps={{ type: typeof window === "undefined" ? "text/javascript" : "text/plain" }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

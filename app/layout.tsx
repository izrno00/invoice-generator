import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

export const metadata: Metadata = {
  title: {
    default: "Payable",
    template: "%s · Payable",
  },
  description: "Create invoices, email them to your clients and get paid by card.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", ibmPlexSans.variable, sourceSans3Heading.variable)}
      // next-themes sets the theme class and color-scheme on <html> before hydration.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

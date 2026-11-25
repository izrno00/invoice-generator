import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // React Email renders with react-dom/server, which throws when bundled for
  // React Server Components (Server Actions). Loaded from node_modules, it
  // gets the regular React build.
  serverExternalPackages: ["@react-email/render"],
  cacheComponents: true,
  partialPrefetching: true,
  // The invoice PDF reads its fonts from disk (lib/pdf/render.ts), so file
  // tracing can't find them. Routes whose Server Actions render PDFs need them.
  outputFileTracingIncludes: {
    "/invoices": ["./lib/pdf/fonts/*.ttf"],
    "/invoices/**": ["./lib/pdf/fonts/*.ttf"],
    "/clients/**": ["./lib/pdf/fonts/*.ttf"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

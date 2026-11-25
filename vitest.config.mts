import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  // Resolves the "@/…" alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, ".next/**", ".agents/**", ".aider-desk/**"],
  },
})

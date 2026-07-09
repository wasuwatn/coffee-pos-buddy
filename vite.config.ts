// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Pinned to Vercel instead of the wrapper's Cloudflare default — this app
  // has no backend of its own (see src/lib/hub/client.ts), so any target
  // works; Vercel matches how the rest of the SMA08 hub's satellite apps
  // (customer.html, expense-review.html) already deploy. Only takes effect
  // outside a Lovable-hosted build, where the preset/output are forced to
  // Cloudflare regardless (see LovableViteTanstackOptions.nitro in
  // node_modules/@lovable.dev/vite-tanstack-config/dist/index.d.ts) — build
  // from the CLI or on Vercel's own build servers, not Lovable's "Publish".
  nitro: { preset: "vercel" },
});

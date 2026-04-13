import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// AI endpoints live under /api/* as Vercel Edge Functions (see frontend/api/).
// For local dev of AI features, run `vercel dev` (serves Vite + functions on
// the same port). Plain `npm run dev` works for non-AI tools.

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || "3000"),
    // FFmpeg.wasm multi-threaded core needs COOP/COEP headers for
    // SharedArrayBuffer. We ship the single-threaded core so this is
    // commented out, but uncomment if you switch to @ffmpeg/core-mt.
    // headers: {
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    //   "Cross-Origin-Opener-Policy": "same-origin",
    // },
  },
  optimizeDeps: {
    // These ship their own workers / WASM and shouldn't be pre-bundled by Vite
    exclude: [
      "@ffmpeg/ffmpeg",
      "@ffmpeg/util",
      "@xenova/transformers",
      "@imgly/background-removal",
    ],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// AI endpoints live under /api/* as Vercel Edge Functions (see frontend/api/).
// For local development of AI features, run `vercel dev` instead of
// `npm run dev` — that serves Vite and the functions on the same port.
// Plain `npm run dev` still works; only the AI requests will 404 locally.

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || "3000"),
  },
});

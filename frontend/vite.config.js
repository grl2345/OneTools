import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || "3000"),
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  // onnxruntime-web ships its own .wasm files that Vite's dep pre-bundler
  // can't handle — exclude it so the browser loads them at runtime.
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname(fileURLToPath(import.meta.url)), "./src"),
      "@convex": path.resolve(dirname(fileURLToPath(import.meta.url)), "./convex"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Allow the Arena preview proxy host (and other localhost-style previews).
    allowedHosts: [".e2b.app", "localhost", "127.0.0.1"],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";

// PORT and BASE_PATH default to local-dev values when not set by a host platform (e.g. Replit).
const port = Number(process.env.PORT ?? "5173");
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    // Replit-only plugins load only when running inside Replit
    ...(process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-clerk": ["@clerk/react"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": ["lucide-react", "framer-motion", "recharts"],
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/gemini": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gemini/, ""),
        secure: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { e2ePreviewCoreStub } from "./vite.e2e-preview";

const host = process.env.TAURI_DEV_HOST || "localhost";

export default defineConfig(async () => ({
  plugins: [react(), e2ePreviewCoreStub()],
  define: {
    'import.meta.env.E2E': JSON.stringify(process.env.E2E === '1'),
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },

  build: {
    // MUI + CodeMirror + app shell; mermaid is already lazy-loaded.
    chunkSizeWarningLimit: 800,
  },

  clearScreen: false,

  server: {
    strictPort: true,
    host: host || false,
    port: 1420,
    proxy: {
      "/api/core": {
        target: "http://127.0.0.1:8741",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/core/, ""),
      },
    },
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  preview:
    process.env.E2E && process.env.E2E_LLM !== "1"
      ? {
          host: "127.0.0.1",
          port: 4173,
          strictPort: true,
          proxy: {},
        }
      : {
          proxy: {
            "/api/core": {
              target: "http://127.0.0.1:8741",
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api\/core/, ""),
              // LLM turns stream for minutes; default proxy timeouts break SSE.
              timeout: 0,
              proxyTimeout: 0,
            },
          },
        },
}));

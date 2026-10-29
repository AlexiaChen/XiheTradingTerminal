import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const webview = mode === "webview";
  return {
    plugins: [tailwindcss()],
    build: {
      target: webview ? "chrome142" : "node22",
      outDir: "out",
      emptyOutDir: !webview,
      minify: false,
      sourcemap: true,
      lib: {
        entry: fileURLToPath(new URL(webview ? "./src/webview/main.ts" : "./src/extension.ts", import.meta.url)),
        formats: [webview ? "iife" : "cjs"],
        name: webview ? "TradingViewSidebar" : undefined,
        cssFileName: "webview",
        fileName: () => webview ? "webview.js" : "extension.js"
      },
      rolldownOptions: webview ? {} : { external: ["vscode"], platform: "node" }
    }
  };
});

import { build } from "vite";

// Clear once, then let both watchers update their own assets without deleting each other's output.
await build({ mode: "production" });
await build({ mode: "webview" });
for (const mode of ["production", "webview"]) {
  await build({ mode, build: { emptyOutDir: false, watch: {} } });
}

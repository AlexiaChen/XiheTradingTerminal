import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { vscode: fileURLToPath(new URL("./test/fixtures/vscode.ts", import.meta.url)) } },
  test: { environment: "node", include: ["test/unit/**/*.test.ts"] }
});

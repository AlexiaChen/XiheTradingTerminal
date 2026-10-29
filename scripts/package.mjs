import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createVSIX } from "@vscode/vsce";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
await mkdir(path.join(root, "dist"), { recursive: true });
const packagePath = path.join(root, "dist", `${manifest.name}-${manifest.version}.vsix`);

// vsce runs vscode:prepublish to build. Tests remain a separate command.
await createVSIX({ cwd: root, packagePath, dependencies: false, rewriteRelativeLinks: false });
console.log(`Install this package in VS Code: ${packagePath}`);

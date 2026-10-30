export const Uri = {
  joinPath: (_base: unknown, ...parts: string[]) => ({ toString: () => `https://webview.test/${parts.join("/")}` })
};
export const window = { showWarningMessage: async () => "Remove", showOpenDialog: async () => undefined, showErrorMessage: async () => undefined };
export const workspace = { get isTrusted() { return true; }, fs: { readFile: async () => new Uint8Array() } };

export const Uri = {
  joinPath: (_base: unknown, ...parts: string[]) => ({ toString: () => `https://webview.test/${parts.join("/")}` })
};
export const window = { showWarningMessage: async () => "Remove" };

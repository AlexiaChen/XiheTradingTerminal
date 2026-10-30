export type FeedLogger = (message: string) => void;

/** Never include proxy userinfo, path, query, or raw transport error messages. */
export function proxyDescription(proxy?: string): string {
  if (!proxy) { return "direct"; }
  try { const url = new URL(proxy); return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`; }
  catch { return "invalid proxy URL"; }
}

export function transportError(error: unknown): string {
  const value = error as { code?: unknown; message?: unknown; errors?: unknown[] } | null;
  const code = typeof value?.code === "string" && /^[A-Z][A-Z0-9_]{1,60}$/.test(value.code) ? value.code : undefined;
  if (code) { return code; }
  if (Array.isArray(value?.errors)) { return [...new Set(value.errors.map(transportError))].join(", "); }
  const message = typeof value?.message === "string" ? value.message : "";
  const response = message.match(/^Unexpected server response: (\d{3})$/);
  if (response) { return `HTTP ${response[1]}`; }
  if (message.includes("handshake has timed out")) { return "WebSocket handshake timed out"; }
  return "Network or proxy connection failed";
}

export function diagnosticText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s]+/gi, "[URL]").replace(/[\r\n\t]/g, " ").slice(0, 300) : "Unknown error";
}

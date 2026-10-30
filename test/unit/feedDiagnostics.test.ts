import { describe, expect, it } from "vitest";
import { diagnosticText, proxyDescription, transportError } from "../../src/feedDiagnostics";

describe("feed diagnostics privacy", () => {
  it("retains only proxy scheme, host and port", () => {
    expect(proxyDescription("http://user:secret@127.0.0.1:7897/private?token=secret")).toBe("http://127.0.0.1:7897");
    expect(proxyDescription()).toBe("direct");
    expect(proxyDescription("invalid secret")).toBe("invalid proxy URL");
  });
  it("uses bounded transport categories instead of raw messages", () => {
    expect(transportError(Object.assign(new Error("secret"), { code: "ENOTFOUND" }))).toBe("ENOTFOUND");
    expect(transportError(new AggregateError([Object.assign(new Error(), { code: "ECONNREFUSED" })]))).toBe("ECONNREFUSED");
    expect(transportError(new Error("Unexpected server response: 407"))).toBe("HTTP 407");
    expect(transportError(new Error("Opening handshake has timed out"))).toContain("timed out");
    expect(transportError(new Error("http://user:secret@proxy"))).toBe("Network or proxy connection failed");
  });
  it("redacts URLs and bounds frontend error text", () => {
    expect(diagnosticText("failed https://user:secret@proxy/path\nnext")).toBe("failed [URL] next");
    expect(diagnosticText("a".repeat(1000))).toHaveLength(300);
  });
});

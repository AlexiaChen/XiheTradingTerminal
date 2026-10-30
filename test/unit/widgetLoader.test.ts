// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWidgetLoader, WIDGET_LOAD_TIMEOUT_MS } from "../../src/webview/widgetLoader";

beforeEach(() => {
  document.head.replaceChildren(); vi.useFakeTimers();
  const append = document.head.appendChild.bind(document.head);
  vi.spyOn(document.head, "appendChild").mockImplementation(node => {
    // Drive script events explicitly; offline DOM tests must never request the hosted library.
    (node as HTMLScriptElement).type = "application/json";
    return append(node);
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("hosted library recovery", () => {
  it("shares one attempt and retries after a network failure", async () => {
    let ready = false;
    const load = createWidgetLoader(document, () => ready, "test-nonce");
    const first = load();
    expect(load()).toBe(first);
    const failed = expect(first).rejects.toThrow("s3.tradingview.com");
    const script = document.querySelector("script")!;
    expect(script.nonce).toBe("test-nonce");
    script.dispatchEvent(new Event("error"));
    await failed;
    const retried = load();
    expect(document.querySelector("script")).not.toBe(script);
    ready = true;
    document.querySelector("script")!.dispatchEvent(new Event("load"));
    await expect(retried).resolves.toBeUndefined();
  });
  it("times out without blocking terminal controls indefinitely", async () => {
    const load = createWidgetLoader(document, () => false, "nonce");
    const failed = expect(load()).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(WIDGET_LOAD_TIMEOUT_MS);
    await failed;
    expect(document.querySelector("script")).toBeNull();
  });
  it("rejects a script that loads without its widget API", async () => {
    const failed = expect(createWidgetLoader(document, () => false, "nonce")()).rejects.toThrow("without its chart API");
    document.querySelector("script")!.dispatchEvent(new Event("load"));
    await failed;
  });
});

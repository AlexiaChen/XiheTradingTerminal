import { describe, expect, it, vi, beforeEach } from "vitest";
import type * as vscode from "vscode";
import type { FeedEvent } from "../../src/marketData/widgetProtocol";
import { TradingViewProvider } from "../../src/tradingViewProvider";

const feeds = vi.hoisted(() => [] as { emit: (event: FeedEvent) => void; dispose: ReturnType<typeof vi.fn> }[]);
vi.mock("../../src/marketData/widgetFeed", () => ({ WidgetFeed: class {
  dispose = vi.fn();
  constructor(_request: unknown, emit: (event: FeedEvent) => void) { feeds.push({ emit, dispose: this.dispose }); }
} }));
function mount() {
  let receive: (message: unknown) => unknown = () => {}, visibility = () => {};
  const postMessage = vi.fn(async () => true);
  const webview = { html: "", cspSource: "https://webview.test", asWebviewUri: (value: unknown) => String(value), onDidReceiveMessage: (callback: typeof receive) => { receive = callback; }, postMessage };
  const view = { webview, visible: true, onDidDispose: vi.fn(), onDidChangeVisibility: (callback: () => void) => { visibility = callback; } };
  const provider = new TradingViewProvider({} as vscode.Uri, { get: () => undefined, update: async () => {}, keys: () => [] } as vscode.Memento);
  provider.resolveWebviewView(view as unknown as vscode.WebviewView, {} as vscode.WebviewViewResolveContext, {} as vscode.CancellationToken);
  return { provider, postMessage, send: (message: unknown) => receive(message), hide: () => { view.visible = false; visibility(); }, show: () => { view.visible = true; visibility(); } };
}
const status: FeedEvent = { kind: "status", state: "connecting", message: "Connecting" };
beforeEach(() => { feeds.length = 0; });
describe("preview extension-host lifecycle", () => {
  it("isolates old feeds and stops only the subscription named by the current client", async () => {
    const page = mount();
    await page.send({ type: "previewSubscribe", id: "first", symbol: "NASDAQ:AAPL", interval: "D" });
    await page.send({ type: "previewSubscribe", id: "second", symbol: "BINANCE:ETHUSDT", interval: "240" });
    expect(feeds[0].dispose).toHaveBeenCalledOnce();
    feeds[0].emit(status); expect(page.postMessage).not.toHaveBeenCalled();
    feeds[1].emit(status); expect(page.postMessage).toHaveBeenCalledWith({ type: "previewFeed", id: "second", event: status });
    await page.send({ type: "previewStop", id: "first" }); expect(feeds[1].dispose).not.toHaveBeenCalled();
    await page.send({ type: "previewStop", id: "second" }); expect(feeds[1].dispose).toHaveBeenCalledOnce();
  });
  it("rejects invalid symbols/timeframes with visible feedback and no outbound connection", async () => {
    const page = mount();
    await page.send({ type: "previewSubscribe", id: "bad", symbol: "https://localhost/private", interval: "D" });
    await page.send({ type: "previewSubscribe", id: "monthly", symbol: "NASDAQ:AAPL", interval: "1M" });
    expect(feeds).toHaveLength(0);
    expect(page.postMessage).toHaveBeenCalledWith(expect.objectContaining({ id: "monthly", event: expect.objectContaining({ state: "error" }) }));
  });
  it("disposes when hidden and requests a fresh subscription on resume", async () => {
    const page = mount(); await page.send({ type: "previewSubscribe", id: "one", symbol: "NASDAQ:AAPL", interval: "D" });
    page.hide(); expect(feeds[0].dispose).toHaveBeenCalledOnce();
    feeds[0].emit(status); expect(page.postMessage).not.toHaveBeenCalled();
    await page.send({ type: "previewSubscribe", id: "hidden", symbol: "NASDAQ:AAPL", interval: "D" }); expect(feeds).toHaveLength(1);
    page.show(); expect(page.postMessage).toHaveBeenCalledWith({ type: "previewResume" });
  });
});

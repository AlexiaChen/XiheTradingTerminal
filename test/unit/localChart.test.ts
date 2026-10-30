// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activeTab, normalizeState } from "../../src/chartState";
import { createLightweightChart } from "../../src/webview/lightweightChart";
import type { FeedEvent, SymbolInfo } from "../../src/marketData/widgetProtocol";

const chart = vi.hoisted(() => ({ addSeries: vi.fn(), remove: vi.fn(), removeSeries: vi.fn(), timeScale: () => ({ setVisibleLogicalRange: vi.fn() }), panes: () => [{ setStretchFactor: vi.fn() }] }));
vi.mock("lightweight-charts", () => ({ createChart: () => chart, CandlestickSeries: "candle", LineSeries: "line", HistogramSeries: "histogram", ColorType: { Solid: "solid" }, LineStyle: { Dashed: 2 } }));
const info: SymbolInfo = { requestedSymbol: "NASDAQ:AAPL", symbol: "BATS_DLY:AAPL", interval: "D", exchange: "Cboe One", timezone: "America/New_York", session: "0930-1600", minTick: 0.01, status: "delayed_streaming_900", description: "Apple", volumeAvailable: true };
const bars = Array.from({ length: 100 }, (_, i) => ({ time: 1000 + i * 60, open: 100, high: 101, low: 99, close: 100, volume: 10 }));
let messages: Record<string, unknown>[];
const send = (message: unknown) => { messages.push(message as Record<string, unknown>); };
function receive(event: FeedEvent, id = String(messages.filter(m => m.type === "previewSubscribe").at(-1)?.id)) {
  window.dispatchEvent(new MessageEvent("message", { origin: window.origin, source: {} as Window, data: { type: "previewFeed", id, event } }));
}
beforeEach(() => {
  vi.stubGlobal("origin", "https://webview.test");
  vi.useFakeTimers(); messages = [];
  chart.addSeries.mockClear(); chart.remove.mockClear();
  document.body.innerHTML = '<div id="local"></div>';
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  chart.addSeries.mockImplementation(() => ({ setData: vi.fn(), applyOptions: vi.fn() }));
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("streamed indicator preview", () => {
  it("renders stocks, source/delay and preset plots; reuses series and never fetches Binance", async () => {
    const tab = activeTab(normalizeState(undefined)); tab.symbol = "NASDAQ:AAPL"; tab.interval = "D";
    tab.localIndicators = ["bollinger", "macd", "supertrend", "squeeze"];
    const view = createLightweightChart(tab, "local", true, send);
    expect(document.querySelector(".local-status")!.textContent).toContain("Connecting");
    receive({ kind: "series", resolution: "main", reset: true, bars, info });
    await vi.advanceTimersByTimeAsync(100);
    expect(chart.addSeries).toHaveBeenCalledTimes(13);
    expect(document.querySelector(".local-legend")!.textContent).toContain("BATS_DLY:AAPL");
    expect(document.querySelector(".local-status")!.textContent).toContain("delayed 15 min");
    const candle = chart.addSeries.mock.results[0].value;
    expect(messages.filter(m => m.type === "previewDiagnostic")).toEqual([
      expect.objectContaining({ stage: "received", resolution: "main", bars: 100 }),
      expect.objectContaining({ stage: "rendered", bars: 100 })
    ]);
    receive({ kind: "series", resolution: "main", reset: false, bars: [{ ...bars.at(-1)!, close: 101 }], info });
    await vi.advanceTimersByTimeAsync(100);
    expect(candle.setData.mock.lastCall[0]).toHaveLength(100);
    expect(candle.setData.mock.lastCall[0].at(-1).close).toBe(101);
    expect(chart.addSeries).toHaveBeenCalledTimes(13); expect(fetch).not.toHaveBeenCalled(); view.remove();
    expect(messages.filter(m => m.type === "previewDiagnostic")).toHaveLength(2);
  });
  it("rejects cross-origin Widget messages, including resume, while accepting host-parent messages", async () => {
    const view = createLightweightChart(activeTab(normalizeState(undefined)), "local", true, send);
    const id = messages.find(m => m.type === "previewSubscribe")!.id;
    for (const data of [{ type: "previewFeed", id, event: { kind: "series", resolution: "main", reset: true, bars, info } }, { type: "previewResume" }]) {
      window.dispatchEvent(new MessageEvent("message", { origin: "https://s.tradingview.com", source: {} as Window, data }));
    }
    await vi.advanceTimersByTimeAsync(100);
    expect(chart.addSeries.mock.results[0].value.setData).not.toHaveBeenCalled();
    expect(messages.filter(m => m.type === "previewSubscribe")).toHaveLength(1);
    receive({ kind: "series", resolution: "main", reset: true, bars, info });
    await vi.advanceTimersByTimeAsync(100);
    expect(chart.addSeries.mock.results[0].value.setData).toHaveBeenCalledOnce();
    view.remove();
  });
  it("logs a render failure once instead of repeating it on every live update", async () => {
    const view = createLightweightChart(activeTab(normalizeState(undefined)), "local", true, send);
    chart.addSeries.mock.results[0].value.setData.mockImplementation(() => { throw new Error("Invalid candle"); });
    for (let index = 0; index < 2; index++) {
      receive({ kind: "series", resolution: "main", reset: true, bars, info });
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(document.querySelector(".local-status")!.textContent).toContain("Invalid candle");
    expect(messages.filter(m => m.stage === "renderError")).toEqual([expect.objectContaining({ message: "Invalid candle" })]);
    view.remove();
  });
  it("stops hidden subscriptions, reloads on resume and rejects stale replies", async () => {
    const view = createLightweightChart(activeTab(normalizeState(undefined)), "local", true, send);
    const previous = String(messages.at(-1)!.id);
    view.setVisible(false); expect(messages.at(-1)!.type).toBe("previewStop");
    view.setVisible(true); const current = String(messages.at(-1)!.id); expect(current).not.toBe(previous);
    receive({ kind: "series", resolution: "main", reset: true, bars, info }, previous);
    await vi.advanceTimersByTimeAsync(100); expect(chart.addSeries.mock.results[0].value.setData).not.toHaveBeenCalled();
    receive({ kind: "series", resolution: "main", reset: true, bars, info }, current);
    await vi.advanceTimersByTimeAsync(100); expect(chart.addSeries.mock.results[0].value.setData).toHaveBeenCalledOnce();
    view.remove(); expect(vi.getTimerCount()).toBe(0);
  });
  it("retains last candles during reconnect and reports missing auxiliary coverage", async () => {
    const tab = activeTab(normalizeState(undefined)); tab.localIndicators = ["volume-delta"];
    const view = createLightweightChart(tab, "local", true, send);
    expect(messages[0].auxiliary).toEqual(["1m"]);
    receive({ kind: "series", resolution: "main", reset: true, bars, info });
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelector(".local-notices")!.textContent).toContain("Awaiting auxiliary Widget data: 1m");
    receive({ kind: "status", state: "reconnecting", message: "Connection lost" });
    expect(document.querySelector(".local-status")!.textContent).toContain("Showing last received candles. Connection lost");
    expect(chart.addSeries.mock.results[0].value.setData.mock.lastCall[0]).toHaveLength(100); view.remove();
  });
  it("skips volume presets when a source has no volume instead of manufacturing it", async () => {
    const tab = activeTab(normalizeState(undefined)); tab.localIndicators = ["volume", "vwap"];
    const view = createLightweightChart(tab, "local", true, send);
    receive({ kind: "series", resolution: "main", reset: true, bars: bars.map(bar => ({ ...bar, volume: null })), info: { ...info, volumeAvailable: false } });
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelector(".local-notices")!.textContent).toContain("volume-dependent preset is skipped");
    expect(chart.addSeries).toHaveBeenCalledTimes(3); view.remove();
  });
});

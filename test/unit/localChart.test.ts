// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activeTab, normalizeState } from "../../src/chartState";
import { createLightweightChart } from "../../src/webview/lightweightChart";

const chart = vi.hoisted(() => ({
  addSeries: vi.fn(), remove: vi.fn(), removeSeries: vi.fn(),
  timeScale: () => ({ setVisibleLogicalRange: vi.fn() })
}));
vi.mock("lightweight-charts", () => ({
  createChart: () => chart,
  CandlestickSeries: "candle", LineSeries: "line", HistogramSeries: "histogram", ColorType: { Solid: "solid" }
}));
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="local"></div>';
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  chart.addSeries.mockImplementation(() => ({ setData: vi.fn(), applyOptions: vi.fn() }));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [[1000, "100", "110", "90", "105", "10"]] }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("local chart polling", () => {
  it("pauses hidden instances and fetches history on resume, then removes all timers", async () => {
    const tab = activeTab(normalizeState(undefined));
    const view = createLightweightChart(tab, "local", true);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("limit=1000");
    view.setVisible(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    view.setVisible(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain("limit=1000");
    await vi.advanceTimersByTimeAsync(15_000);
    expect(String(vi.mocked(fetch).mock.calls[2][0])).toContain("limit=2");
    view.remove();
    const signal = (vi.mocked(fetch).mock.calls[2][1] as RequestInit).signal!;
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("shows network failures and reloads history when the connection recovers", async () => {
    const view = createLightweightChart(activeTab(normalizeState(undefined)), "local", true);
    await vi.advanceTimersByTimeAsync(0);
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network unavailable"));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(document.querySelector(".local-status")!.textContent).toContain("Showing last received candles. Network unavailable");
    await vi.advanceTimersByTimeAsync(15_000);
    expect(String(vi.mocked(fetch).mock.calls[2][0])).toContain("limit=1000");
    view.remove();
  });
});

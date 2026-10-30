import { afterEach, describe, expect, it, vi } from "vitest";
import { IndicatorData, indicatorDataRequirements } from "../../src/marketData/indicatorData";
import { aggregate } from "../../src/indicators/pineSupport";
import type { Candle } from "../../src/marketData";

const start = 1_704_067_200;
const lower: Candle[] = Array.from({ length: 2001 }, (_, i) => ({ time: start + i * 60, open: 100, high: 102, low: 99, close: 101, volume: 10 }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("selected indicator auxiliary data", () => {
  it("requests only selected streams and rejects invalid HTF combinations", () => {
    expect(indicatorDataRequirements(["macd", "liquidity-sweeps"], "240")).toEqual([]);
    expect(indicatorDataRequirements(["nomada-levels"], "360")).toEqual([]);
    expect(indicatorDataRequirements(["nomada-levels"], "240")).toEqual(["4h", "1d", "1w"]);
    expect(indicatorDataRequirements(["volume-delta", "volume-nodes"], "15")).toEqual(["1m"]);
    expect(indicatorDataRequirements(["volume-nodes"], "240")).toEqual(["15m"]);
  });
  it("paginates, merges exact timestamps, then refreshes only the final source bars", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const query = new URL(String(url)).searchParams, from = Number(query.get("startTime")) / 1000, until = Number(query.get("endTime")) / 1000;
      return { ok: true, json: async () => lower.filter(bar => bar.time >= from && bar.time <= until).slice(0, 1000).map(bar => [bar.time * 1000, bar.open, bar.high, bar.low, bar.close, bar.volume]) };
    });
    vi.stubGlobal("fetch", fetcher);
    const cache = new IndicatorData(), bars = aggregate(lower, 300), signal = new AbortController().signal;
    const initial = await cache.load("BINANCE:ETHUSDT", "5", ["volume-delta"], bars, signal);
    expect(initial.series.get("1m")).toEqual(lower); expect(fetcher).toHaveBeenCalledTimes(3);
    await cache.load("BINANCE:ETHUSDT", "5", ["volume-delta"], bars, signal);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(Number(new URL(String(fetcher.mock.calls[3][0])).searchParams.get("startTime"))).toBe(lower.at(-2)!.time * 1000);
    cache.clear(); expect(initial.series.size).toBe(0);
  });
  it("makes no auxiliary request for ordinary presets and propagates provider failures", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 }); vi.stubGlobal("fetch", fetcher);
    const cache = new IndicatorData(), bars = aggregate(lower, 300), signal = new AbortController().signal;
    await cache.load("BINANCE:ETHUSDT", "5", ["macd"], bars, signal); expect(fetcher).not.toHaveBeenCalled();
    await expect(cache.load("BINANCE:ETHUSDT", "5", ["volume-delta"], bars, signal)).rejects.toThrow("HTTP 429");
  });
  it("does not start auxiliary requests after a chart has been cancelled", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController(); controller.abort();
    await expect(new IndicatorData().load("BINANCE:ETHUSDT", "5", ["volume-delta"], aggregate(lower, 300), controller.signal)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

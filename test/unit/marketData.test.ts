import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchCandles, marketDataUrl, mergeCandles, parseKlines } from "../../src/marketData";

const row = (time: number, close = "105") => [time, "100", "110", "90", close, "12"];
afterEach(() => vi.unstubAllGlobals());

describe("Binance spot candles", () => {
  it.each([["240", "4h"], ["360", "6h"], ["480", "8h"]])("requests the native interval %s", (interval, expected) => {
    const url = new URL(marketDataUrl("BINANCE:ETHUSDT", interval));
    expect(url.origin).toBe("https://data-api.binance.vision");
    expect(url.searchParams.get("interval")).toBe(expected);
    expect(url.searchParams.get("symbol")).toBe("ETHUSDT");
  });
  it("rejects unsupported markets without redirecting to another instrument", () => {
    expect(() => marketDataUrl("NASDAQ:AAPL", "240")).toThrow("Binance spot");
    expect(() => marketDataUrl("BINANCE:ETHUSDT.P", "240")).toThrow("Binance spot");
  });
  it("converts milliseconds, rejects invalid OHLC and duplicate timestamps", () => {
    expect(parseKlines([row(1000)])[0]).toEqual({ time: 1, open: 100, high: 110, low: 90, close: 105, volume: 12 });
    expect(() => parseKlines([row(1000, "120")])).toThrow("values");
    expect(() => parseKlines([row(1000), row(1000)])).toThrow("unique");
    expect(() => parseKlines([row(1000, "NaN")])).toThrow("values");
  });
  it("replaces a forming candle and appends new candles without duplicates", () => {
    expect(mergeCandles(parseKlines([row(1000), row(2000)]), parseKlines([row(2000, "106"), row(3000)]))).toMatchObject([{ time: 1, close: 105 }, { time: 2, close: 106 }, { time: 3, close: 105 }]);
  });
  it("reports HTTP errors instead of fabricating chart data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 451 }));
    await expect(fetchCandles("BINANCE:ETHUSDT", "240", new AbortController().signal)).rejects.toThrow("HTTP 451");
  });
});

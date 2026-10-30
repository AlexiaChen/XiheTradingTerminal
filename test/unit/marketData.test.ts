import { describe, expect, it } from "vitest";
import { mergeCandles } from "../../src/marketData";
import { intrabarGroups } from "../../src/indicators/intrabars";
import { parseWidgetCandle, validFeedRequest, WidgetFrameDecoder, widgetCommand, widgetFrame, WidgetSeries } from "../../src/marketData/widgetProtocol";

describe("Widget protocol and bounded candles", () => {
  it("aligns intrabars to actual exchange parent opens and keeps short/missing groups uncovered", () => {
    const start = 1704202200; // a half-hour-offset session open
    const bar = (time: number) => ({ time, open: 100, high: 102, low: 99, close: 101, volume: 10 });
    const parents = [bar(start), bar(start + 3600), bar(start + 7200)];
    const lower = Array.from({ length: 25 }, (_, i) => bar(start + i * 300));
    expect(intrabarGroups(parents, lower, 3600, 300).size).toBe(3);
    expect(intrabarGroups(parents, lower.filter((_, i) => i !== 3), 3600, 300).has(start)).toBe(false);
    expect(intrabarGroups(parents, lower.slice(6), 3600, 300).has(start)).toBe(false);
  });
  it("decodes concatenated, fragmented and Unicode application frames including heartbeats", () => {
    const decoder = new WidgetFrameDecoder(), message = JSON.stringify({ m: "symbol_resolved", p: ["上海"] });
    const framed = widgetFrame(message) + widgetFrame("~h~42");
    expect(decoder.push(framed.slice(0, 2))).toEqual([]);
    expect(decoder.push(framed.slice(2, 14))).toEqual([]);
    expect(decoder.push(framed.slice(14))).toEqual([message, "~h~42"]);
    expect(JSON.parse(new WidgetFrameDecoder().push(widgetCommand("test", [1]))[0])).toEqual({ m: "test", p: [1] });
  });
  it.each(["garbage", "~m~bad~m~x", "~m~4000001~m~x"])("rejects invalid or excessive framing %s", value => {
    expect(() => new WidgetFrameDecoder().push(value)).toThrow();
  });
  it("preserves missing volume, validates OHLC and permits real negative market prices", () => {
    expect(parseWidgetCandle([1000, -2, 1, -3, -1, null]).volume).toBeNull();
    expect(parseWidgetCandle([1000, 10, 12, 9, 11, 0]).volume).toBe(0);
    expect(() => parseWidgetCandle([1000, 10, 11, 9, 12, 10])).toThrow("bounds");
    expect(() => parseWidgetCandle([1000, 10, NaN, 9, 10, 10])).toThrow("OHLC");
    expect(() => parseWidgetCandle([0, 10, 11, 9, 10, 10])).toThrow("bounds");
  });
  it("replaces source-index revisions atomically, sorts timestamps and bounds history", () => {
    const series = new WidgetSeries(2);
    series.update([{ i: 1, v: [200, 10, 12, 9, 11, 10] }, { i: 0, v: [100, 10, 12, 9, 11, 10] }]);
    series.update([{ i: 1, v: [201, 10, 12, 9, 12, 10] }]);
    expect(series.revision).toBe(true);
    expect(series.snapshot().map(bar => bar.time)).toEqual([100, 201]);
    expect(() => series.update([{ i: 2, v: [300, 10, 12, 9, 11, 10] }, { i: 3, v: [400, 10, 11, 9, 20, 10] }])).toThrow();
    expect(series.snapshot()).toHaveLength(2);
    series.update([{ i: 2, v: [300, 10, 12, 9, 11, 10] }]);
    expect(series.snapshot().map(bar => bar.time)).toEqual([201, 300]);
  });
  it("merges forming-bar updates and applies separate main/auxiliary limits", () => {
    const bar = (time: number, close = 11) => ({ time, open: 10, high: 12, low: 9, close, volume: 10 });
    expect(mergeCandles([bar(1), bar(2)], [bar(2, 12), bar(3)], 2)).toEqual([bar(2, 12), bar(3)]);
    expect(mergeCandles([bar(1), bar(2)], [bar(3)], 12_000)).toHaveLength(3);
  });
  it("accepts market symbols and bounded known auxiliary intervals, never arbitrary URLs", () => {
    expect(validFeedRequest({ id: "preview-1", symbol: "NASDAQ:AAPL", interval: "1D", auxiliary: ["1m", "1m", "bad"] })).toEqual({ id: "preview-1", symbol: "NASDAQ:AAPL", interval: "D", auxiliary: ["1m"] });
    expect(validFeedRequest({ id: "1", symbol: "CME_MINI:ES1!", interval: "60" })).toBeDefined();
    expect(validFeedRequest({ id: "1", symbol: "https://localhost/private", interval: "D" })).toBeUndefined();
    expect(validFeedRequest({ id: "1", symbol: "AAPL", interval: "garbage" })).toBeUndefined();
  });
});

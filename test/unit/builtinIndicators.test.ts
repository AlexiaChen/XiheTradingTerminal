import { describe, expect, it } from "vitest";
import { BUILTIN_INDICATORS, normalizeLocalIndicators } from "../../src/indicators/catalog";
import { calculateBuiltin } from "../../src/indicators/builtin";
import { autoFibRetracement } from "../../src/indicators/builtin/support-resistance/autoFibRetracement";
import { supertrend } from "../../src/indicators/builtin/trend/supertrend";
import { sessionVwap } from "../../src/indicators/builtin/volume-order-flow/sessionVwap";
import { atrValues, emaValues, trueRanges } from "../../src/indicators/math";
import type { Candle } from "../../src/marketData";

const midnight = 1_704_067_200;
function bars(prices: number[], wick = 0): Candle[] {
  return prices.map((price, i) => ({ time: midnight + i * 60, open: price, high: price + wick, low: price - wick, close: price, volume: 1 }));
}
const flat = (count: number) => bars(Array(count).fill(100), 1);

describe("built-in indicator formulas", () => {
  it("initializes EMA from the first observation and warms up the ribbon periods", () => {
    const expected = [1, 1 + 2 / 3, 23 / 9, 95 / 27];
    emaValues([1, 2, 3, 4], 2).forEach((value, i) => expect(value).toBeCloseTo(expected[i], 12));
    const plots = calculateBuiltin("ema-ribbon", flat(199), "240").plots;
    expect(plots.map(plot => plot.data.length)).toEqual([180, 150, 0]);
    expect(plots[0].data.every(point => point.value === 100)).toBe(true);
  });

  it("uses population deviation for Bollinger Bands", () => {
    const result = calculateBuiltin("bollinger", bars(Array.from({ length: 20 }, (_, i) => i + 1)), "240");
    expect(result.plots[0].data).toEqual([{ time: midnight + 19 * 60, value: 10.5 }]);
    expect(result.plots[1].data[0].value).toBeCloseTo(10.5 + 2 * Math.sqrt(33.25), 10);
    expect(result.plots[2].data[0].value).toBeCloseTo(10.5 - 2 * Math.sqrt(33.25), 10);
  });

  it("uses rolling highs/lows and the midpoint for Donchian", () => {
    const result = calculateBuiltin("donchian", bars(Array.from({ length: 20 }, (_, i) => 100 + i), 2), "240");
    expect(result.plots.map(plot => plot.data[0].value)).toEqual([121, 109.5, 98]);
  });

  it("includes price gaps in true range and seeds Wilder ATR with a simple mean", () => {
    const input = [
      { time: 1, open: 100, high: 103, low: 99, close: 102, volume: 1 },
      { time: 2, open: 109, high: 112, low: 108, close: 110, volume: 1 },
      { time: 3, open: 106, high: 109, low: 104, close: 105, volume: 1 }
    ];
    expect(trueRanges(input)).toEqual([4, 10, 6]);
    const values = atrValues(input, 2);
    expect(Number.isNaN(values[0])).toBe(true);
    expect(values.slice(1)).toEqual([7, 6.5]);
    expect(calculateBuiltin("atr", flat(14), "240").plots[0].data[0].value).toBe(2);
  });

  it("uses the specified EMA20 / ATR10 × 2 Keltner preset", () => {
    expect(calculateBuiltin("keltner", flat(20), "240").plots.map(plot => plot.data[0].value)).toEqual([100, 104, 96]);
  });

  it("switches Supertrend directions and leaves gaps between opposite legs", () => {
    const result = supertrend(bars([100, 100, 105, 106, 100], 1), 2, 1);
    expect(result.plots[0].data.map(point => point.value)).toEqual([undefined, 101, 103, undefined]);
    expect(result.plots[1].data.map(point => point.value)).toEqual([102, undefined, undefined, 105]);
  });

  it("resets session VWAP at UTC midnight and handles zero volume", () => {
    const input = bars([100, 130, 200]);
    input[0].volume = 2;
    input[2].time = midnight + 86400;
    expect(sessionVwap(input, "240").plots[0].data.map(point => point.value)).toEqual([100, 110, 200]);
    expect(sessionVwap([{ ...input[0], volume: 0 }], "240").plots[0].data).toEqual([]);
    expect(sessionVwap(input, "D")).toMatchObject({ plots: [], notice: expect.stringContaining("intraday") });
  });

  it("omits an incomplete first VWAP session instead of mislabeling a partial average", () => {
    const input = bars([100, 130, 200]);
    input[0].time += 3600; input[1].time += 3600; input[2].time = midnight + 86400;
    expect(sessionVwap(input, "60").plots[0].data).toEqual([{ time: midnight + 86400, value: 200 }]);
    expect(sessionVwap(input, "60").notice).toContain("incomplete");
  });

  it("keeps flat MACD at zero and matches the analytical EMA difference on a ramp", () => {
    const result = calculateBuiltin("macd", flat(50), "240");
    expect(result.plots.every(plot => plot.data.every(point => point.value === 0))).toBe(true);
    expect(result.plots.map(plot => plot.data.length)).toEqual([25, 17, 17]);
    const ramp = calculateBuiltin("macd", bars(Array.from({ length: 100 }, (_, i) => 100 + i)), "240");
    const expected = 7 - 12.5 * (25 / 27) ** 99 + 5.5 * (11 / 13) ** 99;
    expect(ramp.plots[0].data.at(-1)!.value).toBeCloseTo(expected, 10);
    expect(ramp.plots[2].data.at(-1)!.value).toBeCloseTo(ramp.plots[0].data.at(-1)!.value! - ramp.plots[1].data.at(-1)!.value!, 10);
  });

  it("smooths Stochastic 14/3/3 and defines a neutral value for a zero-width range", () => {
    const result = calculateBuiltin("stochastic", bars(Array.from({ length: 20 }, (_, i) => 100 + i)), "240");
    expect(result.plots.map(plot => plot.data.length)).toEqual([5, 3]);
    expect(result.plots.every(plot => plot.data.every(point => point.value === 100))).toBe(true);
    expect(calculateBuiltin("stochastic", bars(Array(20).fill(100)), "240").plots[0].data[0].value).toBe(50);
  });

  it("detects squeeze compression and calculates the regression endpoint momentum", () => {
    const flatResult = calculateBuiltin("squeeze", flat(60), "240");
    expect(flatResult.plots[0].data[0].time).toBe(midnight + 38 * 60);
    expect(flatResult.plots[0].data.every(point => point.value === 0)).toBe(true);
    expect(flatResult.plots[1].data.every(point => point.color === "#d3869b")).toBe(true);
    const ramp = calculateBuiltin("squeeze", bars(Array.from({ length: 60 }, (_, i) => 100 + i), 1), "240");
    expect(ramp.plots[0].data.every(point => Math.abs(point.value! - 9.5) < 1e-10)).toBe(true);
    expect(ramp.plots[1].data.every(point => point.color === "#8ec07c")).toBe(true);
  });
});

describe("automatic Fibonacci levels", () => {
  const wave = [100, 105, 110, 120, 130, 140, 150, 140, 130, 120, 110, 100, 90, 100, 110, 120, 130, 140, 160, 180, 200, 190, 180, 170, 160, 150, 140, 130];
  it("measures retracement on a low-to-high ZigZag swing", () => {
    const result = autoFibRetracement(bars(wave));
    expect(result.plots).toHaveLength(7);
    expect(result.plots.find(plot => plot.name === "Fib 0%")!.data[0].value).toBe(200);
    expect(result.plots.find(plot => plot.name === "Fib 100%")!.data[0].value).toBe(90);
    expect(result.plots.find(plot => plot.name === "Fib 61.8%")!.data[0].value).toBeCloseTo(132.02);
    expect(result.notice).toContain("63.6%");
  });
  it("measures the same retracement amplitude on a high-to-low swing", () => {
    const result = autoFibRetracement(bars(wave.map(value => 400 - value)));
    expect(result.plots.find(plot => plot.name === "Fib 61.8%")!.data[0].value).toBeCloseTo(267.98);
    expect(result.notice).toContain("63.6%");
  });
  it("ignores changes to the forming bar and reports insufficient confirmed pivots", () => {
    const before = autoFibRetracement(bars(wave)).plots.map(plot => plot.data[0].value);
    const modified = [...wave]; modified[modified.length - 1] = 10000;
    expect(autoFibRetracement(bars(modified)).plots.map(plot => plot.data[0].value)).toEqual(before);
    expect(autoFibRetracement(flat(100))).toMatchObject({ plots: [], notice: expect.stringContaining("two confirmed") });
  });
  it("reports outside-swing percentages without clamping them or adding extension levels", () => {
    for (const [price, percentage] of [[210, "-9.1%"], [70, "118.2%"]] as const) {
      const prices = [...wave]; prices[prices.length - 1] = price;
      const result = autoFibRetracement(bars(prices));
      expect(result.notice).toContain(percentage);
      expect(result.notice).toContain("outside 0–100%");
      expect(result.plots.map(plot => plot.name)).toEqual(["Fib 0%", "Fib 23.6%", "Fib 38.2%", "Fib 50%", "Fib 61.8%", "Fib 78.6%", "Fib 100%"]);
    }
  });
});

describe("catalog coverage and numerical boundaries", () => {
  it("deduplicates selections, rejects unknown IDs and migrates legacy Volume/RSI", () => {
    expect(normalizeLocalIndicators(["rsi", "auto-fib", "bad", "rsi"])).toEqual(["auto-fib", "rsi"]);
    expect(normalizeLocalIndicators(undefined, ["Volume@tv-basicstudies", "RSI@tv-basicstudies"])).toEqual(["volume", "rsi"]);
    expect(normalizeLocalIndicators([], ["RSI@tv-basicstudies"])).toEqual([]);
  });
  it.each(BUILTIN_INDICATORS)("$id returns finite, ordered output using candle times", item => {
    for (const input of [[], flat(1), flat(1000), bars(Array.from({ length: 1000 }, (_, i) => 150 + Math.sin(i / 12) * 25), 2)]) {
      const validTimes = new Set(input.map(bar => bar.time));
      for (const plot of calculateBuiltin(item.id, input, "240").plots) {
        expect(plot.data.every((point, i) => validTimes.has(point.time) && (point.value === undefined || Number.isFinite(point.value)) && (!i || point.time > plot.data[i - 1].time))).toBe(true);
      }
    }
  });
  it.each(BUILTIN_INDICATORS.filter(item => item.id !== "auto-fib"))("$id never changes past values when future candles are appended", item => {
    const input = bars(Array.from({ length: 160 }, (_, i) => 150 + Math.sin(i / 12) * 25), 2);
    const prefix = calculateBuiltin(item.id, input.slice(0, 100), "240");
    const full = calculateBuiltin(item.id, input, "240");
    expect(full.plots.map(plot => plot.data.filter(point => point.time <= input[99].time))).toEqual(prefix.plots.map(plot => plot.data));
  });
});

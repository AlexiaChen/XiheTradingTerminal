import { describe, expect, it } from "vitest";
import { rsi, sma, validatePlots, zigzag } from "../../src/indicators";

const bars = (prices: number[]) => prices.map((price, index) => ({ time: index + 1, open: price, high: price + 1, low: price - 1, close: price, volume: 10 }));
describe("local indicators", () => {
  it("uses 90 observations and does not emit an incomplete MA window", () => {
    expect(sma(bars(Array.from({ length: 89 }, (_, i) => i + 1)))).toEqual([]);
    expect(sma(bars(Array.from({ length: 91 }, (_, i) => i + 1)))).toEqual([{ time: 90, value: 45.5 }, { time: 91, value: 46.5 }]);
  });
  it("confirms alternating ZigZag pivots only after the depth window", () => {
    const input = bars([100, 110, 120, 110, 100, 90, 80, 90, 100, 120, 140, 130, 120]);
    expect(zigzag(input.slice(0, 4), 5, 4)).toEqual([]);
    expect(zigzag(input, 5, 4)).toEqual([{ time: 3, value: 121 }, { time: 7, value: 79 }, { time: 11, value: 141 }]);
    expect(zigzag(input, 50, 4)).toEqual([{ time: 11, value: 141 }]);
  });
  it("handles flat, rising and falling RSI without NaN", () => {
    expect(rsi(bars(Array(16).fill(100))).at(-1)?.value).toBe(50);
    expect(rsi(bars(Array.from({ length: 20 }, (_, i) => 100 + i))).at(-1)?.value).toBe(100);
    expect(rsi(bars(Array.from({ length: 20 }, (_, i) => 100 - i))).at(-1)?.value).toBe(0);
  });
  it("validates worker output and rejects future, duplicate and nonfinite points", () => {
    const input = bars([100, 110]);
    expect(validatePlots([{ name: "EMA", color: "#b8bb26", data: [{ time: 1, value: 100 }] }], input)[0]).toMatchObject({ pane: 0, type: "line" });
    for (const data of [[{ time: 3, value: 100 }], [{ time: 1, value: NaN }], [{ time: 1, value: 100 }, { time: 1, value: 101 }]]) {
      expect(() => validatePlots([{ data }], input)).toThrow("Indicator points");
    }
  });
});

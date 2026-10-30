import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PINE_INDICATORS } from "../../src/indicators/pineCatalog";
import { calculateBuiltin } from "../../src/indicators/builtin";
import { aggregate, bucket, fractalHierarchy, hierarchy, pivotAt, transparent } from "../../src/indicators/pineSupport";
import { profileBins, valueArea } from "../../src/indicators/volumeProfileMath";
import { intrabarGroups } from "../../src/indicators/intrabars";
import { orderBlockStrength } from "../../src/indicators/builtin/volume-order-flow/institutionalOrderFlow";
import { evasiveSupertrend } from "../../src/indicators/builtin/trend/evasiveSupertrend";
import { killzoneAt } from "../../src/indicators/builtin/timeframes-sessions/ictKillzones";
import { volumeDeltaCandles } from "../../src/indicators/builtin/volume-order-flow/volumeDeltaCandles";
import { volumeProfileNodes } from "../../src/indicators/builtin/volume-order-flow/volumeProfileNodes";
import type { Candle } from "../../src/marketData";
import type { IndicatorDrawing } from "../../src/indicators/types";

const start = 1_704_067_200;
const candle = (i: number, close: number, open = close, volume = 10): Candle => ({ time: start + i * 60, open, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, close, volume });
const raw = Array.from({ length: 5000 }, (_, i) => {
  const close = 100 + 10 * Math.sin(i / 57) + 5 * Math.sin(i / 17) + i / 3000;
  return candle(i, close, 100 + 10 * Math.sin((i - 1) / 57) + 5 * Math.sin((i - 1) / 17) + (i - 1) / 3000, 100 + (i % 87) * 5);
});
const bars = aggregate(raw, 300);
const context = { series: new Map([["1m", raw], ["15m", aggregate(raw, 900)], ["4h", aggregate(raw, 14400)], ["1d", aggregate(raw, 86400)], ["1w", aggregate(raw, 604800)]]) };
const anchors = (drawing: IndicatorDrawing) => drawing.kind === "label" ? [drawing.at] : drawing.kind === "path" ? drawing.points : drawing.kind === "fill" ? [...drawing.top, ...drawing.bottom] : [drawing.from, drawing.to];

describe("classified Pine adaptations", () => {
  it("accounts for all 30 supplied files and preserves their category/source attribution", () => {
    expect(PINE_INDICATORS).toHaveLength(30);
    expect(new Set(PINE_INDICATORS.map(item => item.source)).size).toBe(30);
    for (const item of PINE_INDICATORS) {
      expect(item.source.startsWith(`${item.category}/`)).toBe(true);
      expect(readFileSync(`third-party/tradingview-indicator/${item.source}`, "utf8")).toContain("//@version");
      expect(item.guide.author).toBeTruthy(); expect(item.guide.usage.length).toBeGreaterThan(30);
    }
  });
  it.each(PINE_INDICATORS)("$id produces bounded finite geometry without changing its input", item => {
    const snapshot = JSON.stringify(bars);
    for (const input of [[], bars.slice(0, 1), bars.slice(0, 40), bars]) {
      const result = calculateBuiltin(item.id, input, "5", context);
      const drawings = result.drawings ?? [];
      expect(drawings.length).toBeLessThanOrEqual(1500);
      expect(drawings.every(drawing => anchors(drawing).every(point => Number.isFinite(point.price) && Number.isFinite(point.index)))).toBe(true);
      expect(new Set(drawings.map(drawing => drawing.id)).size).toBe(drawings.length);
      expect(result.plots.every(plot => plot.data.every(point => point.value === undefined || Number.isFinite(point.value)))).toBe(true);
      expect(JSON.stringify(result)).not.toContain("null");
    }
    expect(JSON.stringify(bars)).toBe(snapshot);
  });
});

describe("source-derived numerical and temporal contracts", () => {
  it("inverts Pine transparency and keeps alpha as an eight-digit CSS color", () => {
    expect(transparent("#089981", 0)).toBe("#089981ff");
    expect(transparent("#089981", 80)).toBe("#08998133");
    expect(transparent("#089981", 100)).toBe("#08998100");
  });
  it("confirms a pivot only after its right-hand observations, using the last equal maximum", () => {
    const input = [1, 3, 5, 5, 2, 1].map((v, i) => candle(i, v));
    expect(pivotAt(input.slice(0, 4), 3, 2)).toBeUndefined();
    expect(pivotAt(input, 4, 2)).toBeUndefined();
    expect(pivotAt(input, 5, 2)).toMatchObject({ index: 3, confirmed: 5, price: 6 });
  });
  it("distinguishes strict ICT patterns from the consuming fractal hierarchy", () => {
    const input = Array.from({ length: 15 }, (_, i) => candle(i, 100));
    expect(hierarchy(input, 1, true)).toEqual([]);
    expect(fractalHierarchy(input, 1, true)[0]).toMatchObject({ index: 1, confirmed: 2 });
    expect(fractalHierarchy(input, 3, true).every(point => point.confirmed > point.index)).toBe(true);
  });
  it("drops incomplete first HTF candles and anchors UTC weeks on Monday", () => {
    const input = [candle(1, 100), candle(2, 110), candle(3, 120), candle(4, 125), candle(5, 130)];
    expect(aggregate(input, 300)).toEqual([{ ...input[4], time: start + 300 }]);
    expect(bucket(start + 3 * 86400, 604800)).toBe(start);
  });
  it("conserves allocated candle volume and expands the value area around POC", () => {
    const input = [{ ...candle(0, 2, 1, 100), low: 0, high: 4 }, { ...candle(1, 2, 3, 40), low: 1, high: 3 }];
    const profile = profileBins(input, 4, 0, 4);
    expect(profile.total).toEqual([25, 45, 45, 25]);
    expect(profile.buy).toEqual([25, 25, 25, 25]);
    expect(valueArea(profile.total, 0.6)).toMatchObject({ poc: 1, lower: 1, upper: 2 });
    const flat = profileBins([{ ...candle(0, 2, 2, 10), low: 2, high: 2 }], 4, 0, 4);
    expect(flat.total.reduce((a, b) => a + b, 0)).toBe(10);
  });
  it("uses 60/40 displacement and relative-volume strength, not a win rate", () => {
    expect(orderBlockStrength(2, 5, 2)).toBe(70);
    expect(orderBlockStrength(2, 10, 2)).toBe(100);
    expect(orderBlockStrength(2, 0, 1)).toBe(20);
  });
  it("pushes the evasive band away by half an ATR before checking a trend flip", () => {
    const input = Array.from({ length: 10 }, (_, i) => candle(i, 100));
    input.push({ time: start + 600, open: 93, high: 94, low: 92, close: 93, volume: 10 });
    const result = evasiveSupertrend(input);
    expect(result.plots[1].data.at(-1)!.value).toBeCloseTo(92.7);
    expect(result.plots[1].data.at(-1)!.color).toBe("#089981");
    expect(result.plots[0].data.at(-1)!.value).toBeUndefined();
  });
  it("keeps Killzones in fixed UTC−5 even during US daylight saving time", () => {
    expect(killzoneAt(Date.parse("2026-07-01T13:30:00Z") / 1000)?.name).toBe("New York AM");
    expect(killzoneAt(Date.parse("2026-07-01T12:30:00Z") / 1000)).toBeUndefined();
  });
  it("rejects incomplete intrabar groups and never substitutes chart bars for missing LTF data", () => {
    const parent = aggregate(raw.slice(0, 15), 300);
    const missing = raw.slice(0, 15).filter((_, i) => i !== 2);
    expect(intrabarGroups(parent, missing, 300, 60).has(parent[0].time)).toBe(false);
    const delta = volumeDeltaCandles(parent, "5", { series: new Map([["1m", missing]]) });
    expect(delta.notice).toContain("2/3"); expect(delta.drawings).toHaveLength(2);
    expect(volumeProfileNodes(bars, "5", { series: new Map() })).toMatchObject({ plots: [], drawings: [], notice: expect.stringContaining("omitted") });
  });
});

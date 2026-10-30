import type { Candle } from "./marketData";

export type IndicatorPoint = { time: number; value: number };
export type IndicatorPlot = { name: string; color: string; pane: 0 | 1; type: "line" | "histogram"; data: IndicatorPoint[] };

export function sma(bars: Candle[], length = 90): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= length) { sum -= bars[i - length].close; }
    if (i >= length - 1) { points.push({ time: bars[i].time, value: sum / length }); }
  }
  return points;
}

/** Symmetric depth-confirmed pivots, filtered by percentage reversal. The latest leg is provisional. */
export function zigzag(bars: Candle[], deviation = 5, depth = 10): IndicatorPoint[] {
  const radius = Math.max(1, Math.floor(depth / 2));
  const pivots: (IndicatorPoint & { kind: "high" | "low" })[] = [];
  for (let i = radius; i < bars.length - radius; i++) {
    const window = bars.slice(i - radius, i + radius + 1);
    const candidates = [
      { kind: "high" as const, value: bars[i].high, pivot: window.every(bar => bar.high <= bars[i].high) && window.slice(radius + 1).every(bar => bar.high < bars[i].high) },
      { kind: "low" as const, value: bars[i].low, pivot: window.every(bar => bar.low >= bars[i].low) && window.slice(radius + 1).every(bar => bar.low > bars[i].low) }
    ];
    for (const candidate of candidates) {
      if (!candidate.pivot) { continue; }
      const point = { time: bars[i].time, value: candidate.value, kind: candidate.kind };
      const last = pivots.at(-1);
      if (!last) { pivots.push(point); }
      else if (last.kind === point.kind) {
        if (point.kind === "high" ? point.value > last.value : point.value < last.value) { pivots[pivots.length - 1] = point; }
      } else if (point.time > last.time && Math.abs(point.value - last.value) / last.value * 100 >= deviation) { pivots.push(point); }
    }
  }
  return pivots.map(({ time, value }) => ({ time, value }));
}

export function rsi(bars: Candle[], length = 14): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  let gain = 0, loss = 0;
  for (let i = 1; i < bars.length; i++) {
    const delta = bars[i].close - bars[i - 1].close;
    if (i <= length) { gain += Math.max(delta, 0) / length; loss += Math.max(-delta, 0) / length; }
    else { gain = (gain * (length - 1) + Math.max(delta, 0)) / length; loss = (loss * (length - 1) + Math.max(-delta, 0)) / length; }
    if (i >= length) { result.push({ time: bars[i].time, value: loss === 0 ? gain === 0 ? 50 : 100 : 100 - 100 / (1 + gain / loss) }); }
  }
  return result;
}

export function validatePlots(raw: unknown, bars: Candle[]): IndicatorPlot[] {
  if (!Array.isArray(raw) || raw.length > 8) { throw new Error("An indicator must return an array of at most 8 plots."); }
  const times = new Set(bars.map(bar => bar.time));
  return raw.map(value => {
    if (!value || typeof value !== "object") { throw new Error("Invalid indicator plot."); }
    const plot = value as Record<string, unknown>;
    if (!Array.isArray(plot.data) || plot.data.length > bars.length) { throw new Error("Indicator plot data must match the candle timestamps."); }
    let previous = -Infinity;
    const data = plot.data.map((point: unknown) => {
      const p = point as IndicatorPoint | undefined;
      if (!p || !Number.isFinite(p.time) || !Number.isFinite(p.value) || !times.has(p.time) || p.time <= previous) { throw new Error("Indicator points must be finite, ordered and use existing candle times."); }
      previous = p.time;
      return { time: p.time, value: p.value };
    });
    return { name: typeof plot.name === "string" ? plot.name.slice(0, 80) : "Custom", color: typeof plot.color === "string" && /^#[0-9a-f]{6}$/i.test(plot.color) ? plot.color : "#b8bb26", pane: plot.pane === 1 ? 1 : 0, type: plot.type === "histogram" ? "histogram" : "line", data };
  });
}

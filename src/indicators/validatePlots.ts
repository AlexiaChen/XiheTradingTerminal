import type { Candle } from "../marketData";
import type { IndicatorPlot, IndicatorPoint } from "./types";

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

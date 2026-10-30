import type { Candle } from "../../../marketData";
import type { IndicatorPoint } from "../../types";

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

import type { Candle } from "../../marketData";
import type { IndicatorPoint } from "../types";

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

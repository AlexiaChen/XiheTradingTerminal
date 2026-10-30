import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import type { Candle } from "../../marketData";
import type { IndicatorPoint } from "../types";

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

export function rsiPreset(bars: Candle[]): BuiltinResult {
  return { plots: [{ name: "RSI 14", color: C.purple, type: "line", data: rsi(bars) }] };
}

import type { Candle } from "../../../marketData";
import type { BuiltinResult } from "../../types";
import { INDICATOR_COLORS as C } from "../../palette";
import { smaValues, extremes, line } from "../../math";

export function stochastic(bars: Candle[]): BuiltinResult {
  const closes = bars.map(bar => bar.close);
  const range = extremes(bars, 14);
  const raw = closes.map((close, i) => !Number.isFinite(range[i].high) ? NaN : range[i].high === range[i].low ? 50 : 100 * (close - range[i].low) / (range[i].high - range[i].low));
  const k = smaValues(raw, 3), d = smaValues(k, 3);
  return { plots: [line("Stoch %K 14,3", C.blue, bars, k), line("Stoch %D 3", C.gold, bars, d)] };
}

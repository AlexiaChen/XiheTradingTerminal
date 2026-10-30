import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import { emaValues, points, line } from "../math";

export function macd(bars: Candle[]): BuiltinResult {
  const closes = bars.map(bar => bar.close);
  const fast = emaValues(closes, 12), slow = emaValues(closes, 26);
  const difference = fast.map((value, i) => value - slow[i]);
  const signal = emaValues(difference, 9), histogram = difference.map((value, i) => value - signal[i]);
  return { plots: [line("MACD 12,26", C.blue, bars, difference, 25), line("Signal EMA9", C.gold, bars, signal, 33), { name: "MACD histogram", color: C.blue, type: "histogram", data: points(bars, histogram, 33).map(point => ({ ...point, color: point.value! >= 0 ? C.blue : C.gold })) }] };
}

import type { Candle } from "../../../marketData";
import type { BuiltinResult } from "../../types";
import { INDICATOR_COLORS as C } from "../../palette";
import { smaValues, deviations, line } from "../../math";

export function bollingerBands(bars: Candle[]): BuiltinResult {
  const closes = bars.map(bar => bar.close);
  const basis = smaValues(closes, 20), std = deviations(closes, 20);
  return { plots: [line("BB 20 basis", C.muted, bars, basis), line("BB upper 2σ", C.aqua, bars, basis.map((value, i) => value + 2 * std[i])), line("BB lower 2σ", C.aqua, bars, basis.map((value, i) => value - 2 * std[i]))] };
}

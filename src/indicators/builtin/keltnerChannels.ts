import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import { emaValues, atrValues, line } from "../math";

export function keltnerChannels(bars: Candle[]): BuiltinResult {
  const closes = bars.map(bar => bar.close);
  const basis = emaValues(closes, 20), width = atrValues(bars, 10);
  return { plots: [line("KC 20 basis", C.muted, bars, basis, 19), line("KC upper ATR10×2", C.orange, bars, basis.map((value, i) => value + 2 * width[i]), 19), line("KC lower ATR10×2", C.orange, bars, basis.map((value, i) => value - 2 * width[i]), 19)] };
}

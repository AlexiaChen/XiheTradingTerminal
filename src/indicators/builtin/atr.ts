import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import { atrValues, line } from "../math";

export function atr(bars: Candle[]): BuiltinResult {
  return { plots: [line("ATR Wilder 14", C.orange, bars, atrValues(bars, 14))] };
}

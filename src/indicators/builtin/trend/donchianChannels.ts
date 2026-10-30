import type { Candle } from "../../../marketData";
import type { BuiltinResult } from "../../types";
import { INDICATOR_COLORS as C } from "../../palette";
import { extremes, line } from "../../math";

export function donchianChannels(bars: Candle[]): BuiltinResult {
  const range = extremes(bars, 20);
  return { plots: [line("DC 20 high", C.purple, bars, range.map(value => value.high)), line("DC 20 middle", C.muted, bars, range.map(value => (value.high + value.low) / 2)), line("DC 20 low", C.purple, bars, range.map(value => value.low))] };
}

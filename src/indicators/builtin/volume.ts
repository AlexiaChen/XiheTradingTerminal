import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";

export function volume(bars: Candle[]): BuiltinResult {
  return { plots: [{ name: "Volume", color: C.blue, type: "histogram", volume: true, data: bars.map(bar => ({ time: bar.time, value: bar.volume, color: bar.close >= bar.open ? C.blue : C.gold })) }] };
}

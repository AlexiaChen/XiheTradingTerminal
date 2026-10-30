import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import { emaValues, line } from "../math";

export function emaRibbon(bars: Candle[]): BuiltinResult {
  const closes = bars.map(bar => bar.close);
  return { plots: [20, 50, 200].map((length, i) => line(`EMA ${length}`, [C.green, C.purple, C.orange][i], bars, emaValues(closes, length), length - 1)) };
}

import type { Candle } from "../../../marketData";
import type { BuiltinResult, BuiltinPoint } from "../../types";
import { INDICATOR_COLORS as C } from "../../palette";
import { atrValues } from "../../math";

export function supertrend(bars: Candle[], length = 10, multiplier = 3): BuiltinResult {
  const ranges = atrValues(bars, length);
  let upper = NaN, lower = NaN, up = false;
  const rising: BuiltinPoint[] = [], falling: BuiltinPoint[] = [];
  for (let i = length - 1; i < bars.length; i++) {
    const middle = (bars[i].high + bars[i].low) / 2;
    const basicUpper = middle + multiplier * ranges[i], basicLower = middle - multiplier * ranges[i];
    if (i === length - 1) { upper = basicUpper; lower = basicLower; }
    else {
      upper = basicUpper < upper || bars[i - 1].close > upper ? basicUpper : upper;
      lower = basicLower > lower || bars[i - 1].close < lower ? basicLower : lower;
      up = up ? bars[i].close >= lower : bars[i].close > upper;
    }
    const point = { time: bars[i].time, value: up ? lower : upper };
    rising.push(up ? point : { time: point.time });
    falling.push(up ? { time: point.time } : point);
  }
  return { plots: [{ name: `Supertrend ${length},${multiplier} up`, color: C.blue, type: "line", data: rising }, { name: `Supertrend ${length},${multiplier} down`, color: C.gold, type: "line", data: falling }] };
}

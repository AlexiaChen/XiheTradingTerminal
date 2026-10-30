import type { Candle } from "../../marketData";
import type { BuiltinResult } from "../types";
import { INDICATOR_COLORS as C } from "../palette";
import { smaValues, deviations, trueRanges, extremes } from "../math";

export function squeezeMomentum(bars: Candle[]): BuiltinResult {
  const length = 20;
  const closes = bars.map(bar => bar.close), basis = smaValues(closes, length), std = deviations(closes, length);
  const width = smaValues(trueRanges(bars), length), range = extremes(bars, length);
  const detrended = closes.map((close, i) => close - ((range[i].high + range[i].low) / 2 + basis[i]) / 2);
  const regression = detrended.map((_, i) => {
    const window = detrended.slice(i - length + 1, i + 1);
    if (i < length - 1 || window.length !== length || !window.every(Number.isFinite)) { return NaN; }
    const mean = window.reduce((sum, value) => sum + value, 0) / length;
    const center = (length - 1) / 2;
    const denominator = window.reduce((sum, _value, x) => sum + (x - center) ** 2, 0);
    const slope = window.reduce((sum, value, x) => sum + (x - center) * (value - mean), 0) / denominator;
    return mean + slope * center;
  });
  const histogram = regression.flatMap((value, i) => {
    if (!Number.isFinite(value)) { return []; }
    const previous = regression[i - 1];
    return [{ time: bars[i].time, value, color: value >= 0 ? value > previous ? C.green : C.blue : value < previous ? C.orange : C.gold }];
  });
  const state = bars.flatMap((bar, i) => {
    if (!Number.isFinite(width[i])) { return []; }
    const on = 2 * std[i] < 1.5 * width[i], off = 2 * std[i] > 1.5 * width[i];
    return [{ time: bar.time, value: 0, color: on ? C.purple : off ? C.aqua : C.muted }];
  });
  return { plots: [{ name: "Squeeze momentum 20", color: C.blue, type: "histogram", data: histogram }, { name: "Squeeze state (purple=on)", color: C.purple, type: "line", style: "dots", data: state }] };
}

import type { Candle } from "../../../marketData";
import type { BuiltinResult } from "../../types";
import { INDICATOR_COLORS as C } from "../../palette";
import { zigzag } from "../market-structure/zigzag";

export function autoFibRetracement(bars: Candle[]): BuiltinResult {
  // Exclude the forming bar. The grid describes only the latest depth-confirmed swing.
  const pivots = zigzag(bars.slice(0, -1), 5, 10);
  const start = pivots.at(-2), end = pivots.at(-1), latest = bars.at(-1);
  if (!start || !end || !latest || start.value === end.value) { return { plots: [], notice: "Auto Fib Retracement needs two confirmed ZigZag pivots (5%, depth 10)." }; }
  const delta = end.value - start.value;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(ratio => ({ name: `Fib ${Number((ratio * 100).toFixed(1))}%`, value: end.value - delta * ratio }));
  const colors = [C.blue, C.aqua, C.green, C.muted, C.gold, C.purple, C.blue];
  const retracement = (end.value - latest.close) / delta * 100;
  return {
    plots: levels.map((level, i) => ({ name: level.name, color: colors[i], type: "line", style: "dashed", data: [{ time: start.time, value: level.value }, { time: latest.time, value: level.value }] })),
    notice: `Fib: current retracement ${retracement.toFixed(1)}% of the latest confirmed swing${retracement < 0 || retracement > 100 ? " (outside 0–100%)" : ""}.`
  };
}

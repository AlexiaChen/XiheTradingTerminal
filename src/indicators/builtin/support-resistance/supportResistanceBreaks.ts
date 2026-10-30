// Adapted from © LuxAlgo, Support and Resistance Levels with Breaks. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/support-resistance/support_and_resistance_levels_with_breaks.pinescript
import type { Candle } from "../../../marketData";
import { emaValues } from "../../math";
import { anchor, DrawingBuilder, pivotAt } from "../../pineSupport";

export function supportResistanceBreaks(bars: Candle[]) {
  const paint = new DrawingBuilder(), fast = emaValues(bars.map(b => b.volume), 5), slow = emaValues(bars.map(b => b.volume), 10);
  let resistance = NaN, support = NaN, resistanceStart = 0, supportStart = 0;
  for (let i = 1; i < bars.length; i++) {
    // Original fixnan(pivot(...)[1]) and -(rightBars+1) offset: available one bar later.
    const high = pivotAt(bars, i - 1, 15), low = pivotAt(bars, i - 1, 15, 15, false);
    const oldResistance = resistance, oldSupport = support;
    if (high) { if (Number.isFinite(resistance)) { paint.segment(anchor(resistanceStart, resistance), anchor(high.index, resistance), "#FF0000", undefined, 3); } resistance = high.price; resistanceStart = high.index; }
    if (low) { if (Number.isFinite(support)) { paint.segment(anchor(supportStart, support), anchor(low.index, support), "#233dee", undefined, 3); } support = low.price; supportStart = low.index; }
    const bar = bars[i], previous = bars[i - 1], oscillator = slow[i] ? 100 * (fast[i] - slow[i]) / slow[i] : 0;
    const up = bar.close > resistance && previous.close <= oldResistance;
    const down = bar.close < support && previous.close >= oldSupport;
    if (up && bar.open - bar.low > bar.close - bar.open) { paint.label(i, bar.low, "Bull Wick", "#4caf50", true); }
    else if (up && oscillator > 20) { paint.label(i, bar.low, "B", "#4caf50", true); }
    if (down && bar.open - bar.close < bar.high - bar.open) { paint.label(i, bar.high, "Bear Wick", "#ff5252"); }
    else if (down && oscillator > 20) { paint.label(i, bar.high, "B", "#ff5252"); }
  }
  if (Number.isFinite(resistance)) { paint.segment(anchor(resistanceStart, resistance), anchor(bars.length - 1, resistance), "#FF0000", undefined, 3); }
  if (Number.isFinite(support)) { paint.segment(anchor(supportStart, support), anchor(bars.length - 1, support), "#233dee", undefined, 3); }
  return paint.result("Pivot rails are drawn back at their origin after 16-bar confirmation; they were not known at that earlier bar.");
}

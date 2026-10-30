// Adapted from © LuxAlgo, FVG Instantaneous Mitigation Signals. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/fvg-ict/FVG_instantaneous_mitigation_signals.pinescript
import type { Candle } from "../../../marketData";
import type { BuiltinPoint } from "../../types";
import { atrValues } from "../../math";
import { anchor, DrawingBuilder, transparent } from "../../pineSupport";

export function fvgInstantaneousMitigation(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 200), trailing: BuiltinPoint[] = [];
  const averages: { start: number; price: number; bullish: boolean; end: number; stopped: boolean }[] = [];
  let stop = NaN, reached = false, direction = 0;
  for (let i = 3; i < bars.length; i++) {
    const bar = bars[i], a = bars[i - 3], b = bars[i - 2], c = bars[i - 1], range = Number.isFinite(atr[i]) ? atr[i] : 0;
    const bullish = a.low > c.high && b.close < a.low && bar.close > a.low;
    const bearish = c.low > a.high && b.close > a.high && bar.close < a.high;
    if (bullish || bearish) {
      direction = bullish ? 1 : 0;
      const top = bullish ? a.low : c.low, bottom = bullish ? c.high : a.high, color = bullish ? "#00897b" : "#f23645";
      paint.box(anchor(i - 3, top), anchor(i, bottom), "#00000000", transparent(color, 50));
      paint.label(i, bullish ? bar.low : bar.high, bullish ? "▲ IMFVG" : "▼ IMFVG", color, bullish);
      averages.push({ start: i, price: (top + bottom) / 2, bullish, end: i, stopped: false });
      stop = bullish ? bar.close - range * 3 : bar.close + range * 3; reached = false;
    } else if (Number.isFinite(stop)) {
      if (direction === 1 && bar.close - stop > range * 3) { stop = bar.close - range * 3; }
      if (direction === 0 && stop - bar.close > range * 3) { stop = bar.close + range * 3; }
      if (direction === 1 ? bar.close < stop : bar.close > stop) { reached = true; }
    }
    for (const level of averages) { if (!level.stopped) { level.end = i; level.stopped = level.bullish ? bar.close < level.price : bar.close > level.price; } }
    trailing.push({ time: bar.time, ...(!reached && !bullish && !bearish && Number.isFinite(stop) ? { value: stop, color: direction ? "#00897b" : "#f23645" } : {}) });
  }
  averages.forEach(level => paint.segment(anchor(level.start, level.price), anchor(level.end, level.price), level.bullish ? "#00897b" : "#f23645", "dashed"));
  return { ...paint.result("Instantly mitigated three-bar gaps; trailing stop ATR200 × 3. Original optional TP/SL areas are off. Candle recoloring is omitted to preserve Gruvbox."), plots: [{ name: "IMFVG trailing stop", type: "line" as const, color: "#00897b", data: trailing }] };
}

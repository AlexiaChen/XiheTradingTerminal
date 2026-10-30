// Adapted from © LuxAlgo, Swing Breakout Sequence. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/market-structure/swing_breakout_sequence.pinescript
import type { Candle } from "../../../marketData";
import type { IndicatorContext } from "../../types";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, transparent } from "../../pineSupport";

type Point = { index: number; price: number; high: boolean };
export function swingBreakoutSequence(input: Candle[], _interval: string, context?: IndicatorContext) {
  const bars = input.slice(0, -1), paint = new DrawingBuilder(), atr = atrValues(bars, 200), swing: Point[] = [], internal: Point[] = [];
  const states = [5, 2].map(length => ({ length, leg: 0, high: bars[0]?.high ?? 0, low: bars[0]?.low ?? 0, index: 0 }));
  let lastSequence = -1;
  const inside = (p: Point, top: Point, bottom: Point) => p.price <= top.price && p.price >= bottom.price;
  const gather = (count: number, i: number) => {
    if (swing.length < count) { return; }
    const [a, b, p1, p2, p3, p4, , p6] = swing.slice(-count);
    const final = count === 8 ? p6 : internal.find(point => point.index > p4.index && point.high === p4.high && Math.abs(point.price - p4.price) <= 0.5 * atr[i]);
    if (!final || a.index <= lastSequence || Math.abs(final.price - p4.price) > 0.5 * atr[i]) { return; }
    const bullish = p1.high && inside(p1, p3, a) && inside(p2, a, b) && inside(p4, a, b);
    const bearish = !p1.high && inside(p1, a, p3) && inside(p2, b, a) && inside(p4, b, a);
    if (!bullish && !bearish) { return; }
    lastSequence = a.index;
    const points = [a, b, p1, p2, p3, p4, final], color = context?.theme === "light" ? "#3c3836" : "#ebdbb2";
    paint.box(anchor(a.index, bullish ? a.price : b.price), anchor(final.index, bullish ? b.price : a.price), "#00000000", transparent(bullish ? BULL : BEAR, 90));
    for (const [j, point] of points.entries()) {
      paint.label(point.index, point.price, j < 2 ? point.high ? "Swing High" : "Swing Low" : String(j - 1), color, !point.high);
      if (j < 5) { paint.segment(anchor(point.index, point.price), anchor(j === 0 ? p1.index : final.index, point.price), color, "dotted"); }
    }
  };
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    // Source evaluates internal transitions before the main swing on the same close.
    for (const stateIndex of [1, 0]) {
      const state = states[stateIndex], window = bars.slice(Math.max(0, i - state.length + 1), i + 1);
      const next = bar.high === Math.max(...window.map(b => b.high)) ? 1 : bar.low === Math.min(...window.map(b => b.low)) ? 0 : state.leg;
      const low = next > state.leg, high = next < state.leg;
      if (next !== state.leg) {
        const points = stateIndex ? internal : swing;
        points.push({ index: state.index, price: low ? state.low : state.high, high: !low });
        if (points.length > (stateIndex ? 5 : 8)) { points.shift(); }
        gather(stateIndex ? 6 : 8, i);
      }
      state.high = low ? bar.high : Math.max(bar.high, state.high); state.low = high ? bar.low : Math.min(bar.low, state.low);
      if (next === 1 && state.high === bar.high || next === 0 && state.low === bar.low) { state.index = i; }
      state.leg = next;
    }
  }
  return paint.result("Closed-bar swing5/internal2 sequence with point5 equal-high/low tolerance 0.5 ATR200. Numbered points are confirmed retrospectively; default path display is off.");
}

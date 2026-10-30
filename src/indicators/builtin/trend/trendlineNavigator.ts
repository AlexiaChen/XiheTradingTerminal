// Adapted from © LuxAlgo, Trendline Breakout Navigator. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/trend/trendline_breakout_navigator.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt } from "../../pineSupport";

type Rail = { start: number; price: number; end: number; endPrice: number; slope: number; bullish: boolean; active: boolean };
export function trendlineNavigator(bars: Candle[]) {
  const paint = new DrawingBuilder();
  for (const [position, length] of [60, 30, 10].entries()) {
    let previousHigh = { index: 0, price: NaN }, previousLow = { index: 0, price: NaN }, trend = 0;
    let rail: Rail | undefined;
    const rails: Rail[] = [];
    let lastHigh = NaN, lastLow = NaN;
    for (let i = 0; i < bars.length; i++) {
      const high = pivotAt(bars, i, length, 1), low = pivotAt(bars, i, length, 1, false);
      const changedHigh = high && Number.isFinite(lastHigh) && high.price !== lastHigh;
      const changedLow = low && Number.isFinite(lastLow) && low.price !== lastLow;
      if (high) { lastHigh = high.price; } if (low) { lastLow = low.price; }
      if (rail?.active) { rail.end = i; rail.endPrice += rail.slope; }
      for (const isHigh of [true, false]) {
        const changed = isHigh ? changedHigh && !changedLow : changedLow && !changedHigh;
        if (!changed) {
          if (rail?.active && (isHigh ? trend < 1 && bars[i].close > rail.endPrice : trend > -1 && bars[i].close < rail.endPrice)) { rail.active = false; }
          continue;
        }
        let x = i;
        // Original request tuple time[2] scan includes the first bar preceding that timestamp.
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) { if (isHigh ? bars[j].high > bars[x].high : bars[j].low < bars[x].low) { x = j; } }
        const price = isHigh ? bars[x].high : bars[x].low, previous = isHigh ? previousHigh : previousLow, opposite = isHigh ? previousLow : previousHigh;
        if (isHigh ? trend < 1 : trend > -1) {
          if ((isHigh ? price > previous.price : price < previous.price) && x - previous.index > 5 && Number.isFinite(opposite.price)) {
            trend = isHigh ? 1 : -1;
            rail = { start: opposite.index, price: opposite.price, end: i, endPrice: opposite.price, slope: 0, bullish: isHigh, active: true }; rails.push(rail);
          } else if (rail?.active && x !== rail.start) {
            let slope = (price - rail.price) / (x - rail.start);
            const eligible = isHigh ? price < rail.price + slope && (price > rail.endPrice + slope || rail.slope === 0) : price > rail.price + slope && (price < rail.endPrice + slope || rail.slope === 0);
            if (eligible) {
              const oldAtPivot = rail.price + rail.slope * (x - rail.start), accepted = isHigh ? bars[x].close < oldAtPivot : bars[x].close > oldAtPivot;
              if (!accepted) { rail.active = false; }
              else {
                if (rail.slope) { paint.label(x, oldAtPivot, "●", isHigh ? "#ff5d00" : "#085def"); }
                if (rail.slope === 0) {
                  // Bounded fit replaces the source's unbounded while when an anchor degenerates.
                  for (let iteration = 0; iteration < bars.length; iteration++) {
                    let worst = -1, error = 0;
                    for (let j = i; j >= rail.start; j--) {
                      const value = rail.price + slope * (j - rail.start), violation = isHigh ? bars[j].close - value : value - bars[j].close;
                      if (violation > error) { error = violation; worst = j; }
                    }
                    if (worst < 0) { break; }
                    if (worst === x || worst === rail.start) { rail.active = false; break; }
                    rail.start = worst; rail.price = isHigh ? bars[worst].high : bars[worst].low; slope = (price - rail.price) / (x - worst);
                  }
                }
                rail.slope = slope; rail.endPrice = price + slope * (i - x);
              }
            }
          }
        }
        if (isHigh) { previousHigh = { index: x, price }; } else { previousLow = { index: x, price }; }
      }
    }
    rails.forEach(line => paint.segment(anchor(line.start, line.price), anchor(line.end, line.endPrice), line.bullish ? BULL : BEAR, position === 0 ? undefined : position === 1 ? "dashed" : "dotted", position === 0 ? 2 : 1));
  }
  return paint.result("Chart-timeframe preset: long/medium/short 60/30/10, right confirmation 1. Blue/orange dots show wick breaks; fitting uses confirmed pivots and bounded iterations.");
}

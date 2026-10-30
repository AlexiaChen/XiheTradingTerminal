// Adapted from © LuxAlgo, Pure Price Action Liquidity Sweeps. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/market-structure/pure_price_action_liquidity_sweeps.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, BULL, DrawingBuilder, fractalHierarchy } from "../../pineSupport";

export function purePriceActionLiquiditySweeps(bars: Candle[]) {
  const paint = new DrawingBuilder();
  for (const high of [true, false]) {
    const pivots = fractalHierarchy(bars, 3, high).filter((pivot, i, all) => i === 0 || pivot.price !== all[i - 1].price);
    for (const pivot of pivots) {
      let swept = false;
      for (let i = pivot.confirmed; i < Math.min(bars.length, pivot.index + 2001); i++) {
        const bar = bars[i];
        if (high ? bar.close > pivot.price : bar.close < pivot.price) { break; }
        if (!swept && (high ? bar.high > pivot.price && bar.close < pivot.price : bar.low < pivot.price && bar.close > pivot.price)) {
          const color = high ? BEAR : BULL;
          paint.segment(anchor(pivot.index, pivot.price), anchor(i, pivot.price), color);
          paint.box(anchor(i - 1, high ? bar.high : pivot.price), anchor(i + 1, high ? pivot.price : bar.low), "#00000000", `${color}80`);
          paint.label(i, high ? bar.high : bar.low, "LT Sweep", color, !high); swept = true;
        }
      }
    }
  }
  return paint.result("Original Long Term three-level price-pattern hierarchy; a sweep is a wick through a level followed by a close back inside.");
}

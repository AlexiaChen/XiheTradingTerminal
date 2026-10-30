// Adapted from © LuxAlgo, Pure Price Action Structures. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/market-structure/pure_price_action_structures.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, BULL, DrawingBuilder, hierarchy, type Pivot } from "../../pineSupport";

export function purePriceActionStructures(bars: Candle[]) {
  const paint = new DrawingBuilder();
  for (let depth = 1; depth <= 3; depth++) {
    const pivots = [...hierarchy(bars, depth, true), ...hierarchy(bars, depth, false)].sort((a, b) => a.confirmed - b.confirmed || Number(a.high) - Number(b.high));
    let top: Pivot | undefined, bottom: Pivot | undefined, topCrossed = false, bottomCrossed = false, cursor = 0, direction = 0;
    for (let i = 0; i < bars.length; i++) {
      while (cursor < pivots.length && pivots[cursor].confirmed <= i) {
        const pivot = pivots[cursor++];
        if (pivot.high) { top = pivot; topCrossed = false; } else { bottom = pivot; bottomCrossed = false; }
        if (depth === 3) { paint.label(pivot.index, pivot.price, "◉", pivot.high ? BULL : BEAR, !pivot.high); }
      }
      for (const [pivot, crossed, bullish] of [[bottom, bottomCrossed, false], [top, topCrossed, true]] as const) {
        if (!pivot || crossed || !(bullish ? bars[i].close > pivot.price : bars[i].close < pivot.price)) { continue; }
        const color = bullish ? BULL : BEAR;
        paint.segment(anchor(pivot.index, pivot.price), anchor(i, pivot.price), color, depth === 1 ? "dotted" : depth === 2 ? "dashed" : undefined);
        if (depth === 3) { paint.label((pivot.index + i) / 2, pivot.price, `LT-${direction === (bullish ? -1 : 1) ? "MSS" : "BOS"}`, color, !bullish); }
        direction = bullish ? 1 : -1;
        if (bullish) { topCrossed = true; } else { bottomCrossed = true; }
      }
    }
  }
  return paint.result("ST/IT/LT pivots appear only after their confirming pattern; their origin marks are retrospective.");
}

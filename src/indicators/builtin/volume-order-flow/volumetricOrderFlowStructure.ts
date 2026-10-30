// Adapted from © LuxAlgo, Volumetric Order Flow Structure. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/volumetric_order_flow_structure.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent, type Pivot } from "../../pineSupport";

export function volumetricOrderFlowStructure(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 14);
  let top: Pivot | undefined, bottom: Pivot | undefined, trend = 0;
  const blocks: { index: number; high: number; low: number; open: number; close: number; bullish: boolean; marks: { index: number; price: number }[] }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]; top = pivotAt(bars, i, 3) ?? top; bottom = pivotAt(bars, i, 3, 3, false) ?? bottom;
    const bull = !!top && bar.close > top.price && (bars[i - 1]?.close ?? Infinity) <= top.price;
    const bear = !!bottom && bar.close < bottom.price && (bars[i - 1]?.close ?? -Infinity) >= bottom.price;
    if (bull || bear) {
      const pivot = (bull ? top : bottom)!, source = bars[pivot.index], color = bull ? BULL : BEAR;
      const h = Number.isFinite(atr[i]) ? atr[i] * 0.05 : source.close * 0.0001;
      const portion = (bar.high - bar.low) > 0 ? (bull ? bar.close - bar.low : bar.high - bar.close) / (bar.high - bar.low) : 0.5;
      paint.box(anchor(pivot.index, pivot.price + h), anchor(i, pivot.price - h), "#00000000", transparent(color, 92));
      paint.box(anchor(pivot.index, pivot.price + h * 0.8), anchor(pivot.index + Math.round((i - pivot.index) * Math.max(0.1, portion)), pivot.price - h * 0.8), "#00000000", transparent(color, 20));
      paint.label((pivot.index + i) / 2, pivot.price, trend === (bull ? -1 : 1) ? "CHoCH" : "BOS", color, !bull);
      blocks.push({ index: pivot.index, high: source.high, low: source.low, open: source.open, close: source.close, bullish: bull, marks: [] });
      if (blocks.length > 5) { blocks.shift(); }
      trend = bull ? 1 : -1;
      if (bull) { top = undefined; } else { bottom = undefined; }
    }
    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      if (block.bullish ? bar.close < block.low : bar.close > block.high) { blocks.splice(j, 1); continue; }
      if (i > block.index && (block.bullish ? bar.low < block.low && bar.close >= block.low : bar.high > block.high && bar.close <= block.high)) {
        block.marks.push({ index: i, price: block.bullish ? bar.low : bar.high });
      }
    }
  }
  const n = bars.length - 1;
  for (const block of blocks) {
    const color = block.bullish ? BULL : BEAR, step = (block.high - block.low) / 15, bodyMax = Math.max(block.open, block.close), bodyMin = Math.min(block.open, block.close);
    const weights = Array.from({ length: 15 }, (_, k) => {
      const top = block.high - k * step, bottom = top - step;
      return Math.trunc(Math.max(2, 12 - Math.abs(k - 7.5) * 1.5)) + ((top <= bodyMax && top >= bodyMin) || (bottom <= bodyMax && bottom >= bodyMin) ? 5 : 0);
    });
    const poc = weights.indexOf(Math.max(...weights));
    weights.forEach((weight, k) => {
      const top = block.high - k * step, bottom = top - step;
      paint.box(anchor(block.index, top), anchor(n + 10, bottom), "#00000000", transparent(color, top <= bodyMax && top >= bodyMin ? 80 : 90));
      paint.box(anchor(n + 11, top), anchor(n + 11 + weight, bottom), "#00000000", transparent(k === poc ? "#ff9800" : color, 50));
    });
    block.marks.slice(-30).forEach(mark => paint.label(mark.index, mark.price, "●", color, block.bullish));
  }
  return paint.result("15-row profiles use the author's synthetic body-distance weights, not measured volume at price. Profile shapes and bubbles are visual estimates.");
}

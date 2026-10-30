// Adapted from © LuxAlgo, Institutional Order Flow Strength Classifier. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/institutional_order_flow_strength_classifier.pinescript
import type { Candle } from "../../../marketData";
import { smaValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent, type Pivot } from "../../pineSupport";

export function orderBlockStrength(height: number, distance: number, relativeVolume: number) {
  const displacement = height > 0 ? Math.min(distance / (height * 5), 1) * 60 : 0;
  return Math.round((displacement + Math.min(relativeVolume / 2, 1) * 40) * 10) / 10;
}

export function institutionalOrderFlow(bars: Candle[]) {
  const paint = new DrawingBuilder(), volume = smaValues(bars.map(bar => bar.volume), 20);
  const blocks: { index: number; top: number; bottom: number; bullish: boolean; strength: number; mitigated: boolean }[] = [];
  let top: Pivot | undefined, bottom: Pivot | undefined;
  for (let i = 0; i < bars.length; i++) {
    top = pivotAt(bars, i, 5) ?? top; bottom = pivotAt(bars, i, 5, 5, false) ?? bottom;
    const bar = bars[i], bullish = !!top && bar.close > top.price && (bars[i - 1]?.close ?? Infinity) <= top.price;
    const bearish = !!bottom && bar.close < bottom.price && (bars[i - 1]?.close ?? -Infinity) >= bottom.price;
    if (bullish || bearish) {
      const start = (bullish ? top : bottom)!.index;
      let candidate = -1;
      for (let j = i - 1; j >= start; j--) {
        if ((bullish ? bars[j].close < bars[j].open : bars[j].close > bars[j].open) && (candidate < 0 || (bullish ? bars[j].low < bars[candidate].low : bars[j].high > bars[candidate].high))) { candidate = j; }
      }
      if (candidate >= 0) {
        const source = bars[candidate], height = source.high - source.low, distance = bullish ? bar.close - source.high : source.low - bar.close;
        // Original volume and displacement classifier, capped at 100, not a probability.
        const strength = orderBlockStrength(height, distance, volume[candidate] > 0 ? source.volume / volume[candidate] : 0);
        blocks.unshift({ index: candidate, top: source.high, bottom: source.low, bullish, strength, mitigated: false });
      }
      if (bullish) { top = undefined; } else { bottom = undefined; }
    }
    blocks.forEach(block => { if (!block.mitigated && (block.bullish ? bar.low < block.bottom : bar.high > block.top)) { block.mitigated = true; } });
    const active = blocks.filter(block => !block.mitigated).slice(0, 5);
    const strongest = active.reduce<typeof active[number] | undefined>((best, block) => !best || block.strength > best.strength ? block : best, undefined);
    if (strongest && i > 0) {
      const color = strongest.bullish ? BULL : BEAR;
      paint.box(anchor(i - 1, strongest.top), anchor(i, strongest.bottom), "#00000000", transparent(color, 90));
      paint.segment(anchor(i - 1, (strongest.top + strongest.bottom) / 2), anchor(i, (strongest.top + strongest.bottom) / 2), transparent(color, 40), undefined, 2);
    }
    if (blocks.length > 100) { blocks.splice(100); }
  }
  const occupied: typeof blocks = [];
  for (const block of blocks.filter(block => !block.mitigated)) {
    if (occupied.length >= 5) { break; }
    if (occupied.some(other => block.bottom <= other.top && block.top >= other.bottom)) { continue; }
    occupied.push(block);
    const color = block.bullish ? BULL : BEAR;
    const box = paint.box(anchor(block.index, block.top), anchor(bars.length - 1, block.bottom), transparent(color, 80), transparent(color, 80)); box.dash = "dashed";
    paint.label(bars.length - 1, (block.top + block.bottom) / 2, `${block.strength}% strength`, color);
  }
  return paint.result("Strength is a price/volume score, not institutional trade data or a win probability.");
}

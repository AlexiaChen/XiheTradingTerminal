// Adapted from © LuxAlgo, Smart Money Concepts. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/fvg-ict/smart_money_concepts.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, legPivots, transparent, type Pivot } from "../../pineSupport";

export function smartMoneyConcepts(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 200);
  type Level = Pivot & { crossed: boolean };
  const layers = [5, 50, 3].map(length => ({ pivots: legPivots(bars, length), cursor: 0, top: undefined as Level | undefined, bottom: undefined as Level | undefined, direction: 0 }));
  const blocks: { start: number; high: number; low: number; bullish: boolean }[] = [];
  let trailingHigh = NaN, trailingLow = NaN, highIndex = 0, lowIndex = 0;
  const parsedHigh = bars.map((bar, i) => bar.high - bar.low >= 2 * atr[i] ? bar.low : bar.high);
  const parsedLow = bars.map((bar, i) => bar.high - bar.low >= 2 * atr[i] ? bar.high : bar.low);
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar.high >= trailingHigh) { trailingHigh = bar.high; highIndex = i; }
    if (bar.low <= trailingLow) { trailingLow = bar.low; lowIndex = i; }
    for (const [layerIndex, layer] of layers.entries()) {
      while (layer.cursor < layer.pivots.length && layer.pivots[layer.cursor].confirmed === i) {
        const pivot = layer.pivots[layer.cursor++], previous = pivot.high ? layer.top : layer.bottom;
        if (layerIndex === 2 && previous && Math.abs(previous.price - pivot.price) < 0.1 * atr[i]) {
          const color = pivot.high ? BEAR : BULL;
          paint.segment(anchor(previous.index, previous.price), anchor(pivot.index, pivot.price), color, "dotted");
          paint.label((previous.index + pivot.index) / 2, pivot.price, pivot.high ? "EQH" : "EQL", color, !pivot.high);
        }
        if (pivot.high) { layer.top = { ...pivot, crossed: false }; if (layerIndex === 1) { trailingHigh = pivot.price; highIndex = pivot.index; } }
        else { layer.bottom = { ...pivot, crossed: false }; if (layerIndex === 1) { trailingLow = pivot.price; lowIndex = pivot.index; } }
      }
    }
    for (const index of [0, 1]) {
      const layer = layers[index];
      for (const bullish of [true, false]) {
        const level = bullish ? layer.top : layer.bottom;
        if (!level || level.crossed || i === 0 || !(bullish ? bar.close > level.price && bars[i - 1].close <= level.price : bar.close < level.price && bars[i - 1].close >= level.price)) { continue; }
        const swingLevel = bullish ? layers[1].top : layers[1].bottom;
        if (index === 0 && swingLevel?.price === level.price) { continue; }
        const color = bullish ? BULL : BEAR, text = layer.direction === (bullish ? -1 : 1) ? "CHoCH" : "BOS";
        paint.segment(anchor(level.index, level.price), anchor(i, level.price), color, index === 0 ? "dashed" : undefined);
        paint.label((level.index + i) / 2, level.price, `${index === 0 ? "i" : "s"}${text}`, color, !bullish);
        level.crossed = true; layer.direction = bullish ? 1 : -1;
        if (index === 0 && level.index < i) {
          let candidate = level.index;
          for (let j = level.index + 1; j < i; j++) { if (bullish ? parsedLow[j] < parsedLow[candidate] : parsedHigh[j] > parsedHigh[candidate]) { candidate = j; } }
          blocks.unshift({ start: candidate, high: parsedHigh[candidate], low: parsedLow[candidate], bullish }); if (blocks.length > 100) { blocks.pop(); }
        }
      }
    }
    for (let k = blocks.length - 1; k >= 0; k--) { if (blocks[k].bullish ? bar.low < blocks[k].low : bar.high > blocks[k].high) { blocks.splice(k, 1); } }
  }
  blocks.slice(0, 5).forEach(block => paint.box(anchor(block.start, block.high), anchor(bars.length - 1, block.low), "#00000000", transparent(block.bullish ? "#3179f5" : "#f77c80", 80)));
  if (Number.isFinite(trailingHigh)) { paint.segment(anchor(highIndex, trailingHigh), anchor(bars.length + 19, trailingHigh), BEAR); paint.label(bars.length + 19, trailingHigh, layers[1].direction === -1 ? "Strong High" : "Weak High", BEAR); }
  if (Number.isFinite(trailingLow)) { paint.segment(anchor(lowIndex, trailingLow), anchor(bars.length + 19, trailingLow), BULL); paint.label(bars.length + 19, trailingLow, layers[1].direction === 1 ? "Strong Low" : "Weak Low", BULL, true); }
  return paint.result("Original default layers: internal/swing structure, internal OBs, EQH/EQL and strong/weak extremes. Optional HTF FVG, swing OBs and premium/discount settings are off.");
}

// Adapted from © LuxAlgo, Pure Price Action ICT Tools. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/fvg-ict/pure_price_action_ICT_tools.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, fractalHierarchy, hierarchy, transparent, type Pivot } from "../../pineSupport";

export function purePriceActionIct(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 200), atr10 = atrValues(bars, 10);
  const intermediate = [...hierarchy(bars, 2, true), ...hierarchy(bars, 2, false)].sort((a, b) => a.confirmed - b.confirmed);
  const long = [...fractalHierarchy(bars, 3, true), ...fractalHierarchy(bars, 3, false)].sort((a, b) => a.confirmed - b.confirmed);
  type Level = Pivot & { crossed: boolean };
  let structureHigh: Level | undefined, structureLow: Level | undefined, blockHigh: Level | undefined, blockLow: Level | undefined, structureCursor = 0, blockCursor = 0, bias = 0;
  const history: Pivot[] = [], liquidity: { start: number; price: number; bound: number; high: boolean; end?: number }[] = [];
  const blocks: { start: number; top: number; bottom: number; bullish: boolean; breaker?: number }[] = [];
  const voids: { start: number; top: number; bottom: number; bullish: boolean; end: number }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    while (structureCursor < intermediate.length && intermediate[structureCursor].confirmed === i) {
      const pivot = intermediate[structureCursor++];
      if (pivot.high) { structureHigh = { ...pivot, crossed: false }; } else { structureLow = { ...pivot, crossed: false }; }
      const last = history.at(-1);
      if (last?.high === pivot.high) { if (pivot.high ? pivot.price > last.price : pivot.price < last.price) { history[history.length - 1] = pivot; } }
      else { history.push(pivot); if (history.length > 50) { history.shift(); } }
      const margin = atr10[i] / (10 / 6.9), same: Pivot[] = [];
      for (const old of history.slice().reverse()) {
        if (old.high !== pivot.high) { continue; }
        if (pivot.high ? old.price > pivot.price + margin : old.price < pivot.price - margin) { break; }
        if (Math.abs(old.price - pivot.price) < margin) { same.push(old); }
      }
      if (same.length > 2) {
        const start = same.at(-1)!, midpoint = (Math.min(...same.map(p => p.price)) + Math.max(...same.map(p => p.price))) / 2;
        const existing = liquidity.find(level => level.start === start.index && level.high === pivot.high);
        if (existing) { existing.bound = midpoint + (pivot.high ? margin : -margin); }
        else { liquidity.push({ start: start.index, price: start.price, bound: midpoint + (pivot.high ? margin : -margin), high: pivot.high }); }
        const perSide = liquidity.filter(level => level.high === pivot.high); if (perSide.length > 3) { liquidity.splice(liquidity.indexOf(perSide[0]), 1); }
      }
    }
    while (blockCursor < long.length && long[blockCursor].confirmed === i) {
      const pivot = long[blockCursor++];
      if (pivot.high) { blockHigh = { ...pivot, crossed: false }; } else { blockLow = { ...pivot, crossed: false }; }
      paint.label(pivot.index, pivot.price, "⦁", pivot.high ? BEAR : BULL, !pivot.high);
    }
    for (const bullish of [true, false]) {
      const structure = bullish ? structureHigh : structureLow;
      if (structure && !structure.crossed && (bullish ? bar.close > structure.price : bar.close < structure.price)) {
        const color = bullish ? BULL : BEAR; structure.crossed = true;
        paint.segment(anchor(structure.index, structure.price), anchor(i, structure.price), color);
        paint.label((structure.index + i) / 2, structure.price, bias === (bullish ? -1 : 1) ? "MSS" : "BOS", color, !bullish); bias = bullish ? 1 : -1;
      }
      const pivot = bullish ? blockHigh : blockLow;
      if (pivot && !pivot.crossed && i > pivot.index + 1 && (bullish ? bar.close > pivot.price : bar.close < pivot.price)) {
        pivot.crossed = true;
        let candidate = i - 1;
        for (let j = i - 1; j > pivot.index; j--) { if (bullish ? Math.min(bars[j].close, bars[j].open) <= Math.min(bars[candidate].close, bars[candidate].open) : Math.max(bars[j].close, bars[j].open) >= Math.max(bars[candidate].close, bars[candidate].open)) { candidate = j; } }
        const source = bars[candidate]; blocks.unshift({ start: candidate, top: Math.max(source.open, source.close), bottom: Math.min(source.open, source.close), bullish });
        if (blocks.length > 200) { blocks.pop(); }
      }
    }
    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      if (block.breaker === undefined) { if (block.bullish ? Math.min(bar.open, bar.close) < block.bottom : Math.max(bar.open, bar.close) > block.top) { block.breaker = i; } }
      else if (block.bullish ? bar.close > block.top : bar.close < block.bottom) { blocks.splice(j, 1); }
    }
    for (const level of liquidity) { if (level.end === undefined && (level.high ? bar.high > level.bound : bar.low < level.bound)) { level.end = i; } }
    if (i >= 2 && bars.length - 1 - i <= 360 && Number.isFinite(atr[i])) {
      for (const bullish of [true, false]) {
        const top = bullish ? bar.low : bars[i - 2].low, bottom = bullish ? bars[i - 2].high : bar.high;
        if (top - bottom > atr[i] * 0.75 && (bullish ? bars[i - 1].close > bottom : bars[i - 1].close < top)) {
          for (let row = 0; row < 13; row++) { voids.push({ start: i - 2, bottom: bottom + (top - bottom) * row / 13, top: bottom + (top - bottom) * (row + 1) / 13, bullish, end: i }); }
        }
      }
    }
    for (let j = voids.length - 1; j >= 0; j--) {
      const zone = voids[j], middle = (zone.top + zone.bottom) / 2;
      if (i > 0 && [bar.close, bar.high, bar.low].some(value => Math.sign(bars[i - 1].close - middle) !== Math.sign(value - middle))) { voids.splice(j, 1); } else { zone.end = i + 1; }
    }
  }
  for (const bullish of [true, false]) {
    for (const block of blocks.filter(block => block.bullish === bullish).slice(0, 3)) {
      const color = bullish ? BULL : BEAR, end = block.breaker ?? bars.length - 1;
      paint.box(anchor(block.start, block.top), anchor(end, block.bottom), "#00000000", transparent(color, 73), "OB");
      if (block.breaker !== undefined) { const ink = bullish ? BEAR : BULL; paint.segment(anchor(block.breaker, block.top), anchor(bars.length - 1, block.top), transparent(ink, 41)); paint.segment(anchor(block.breaker, block.bottom), anchor(bars.length - 1, block.bottom), transparent(ink, 41)); }
    }
  }
  liquidity.forEach(level => { const color = level.high ? BULL : BEAR; paint.segment(anchor(level.start, level.price), anchor(level.end ?? bars.length - 1, level.price), color); paint.label(level.end ?? bars.length - 1, level.price, level.high ? "Buyside liquidity" : "Sellside liquidity", color, !level.high); });
  voids.forEach(zone => paint.box(anchor(zone.start, zone.top), anchor(zone.end, zone.bottom), "#00000000", zone.bullish ? "#B2B5BE41" : "#5D606B41"));
  return paint.result("Default intermediate structures/liquidity, long-term body OB/BBs and swings; ATR200 ×0.75 voids over the recent 360 bars. Void rows disappear as price crosses their midpoints.");
}

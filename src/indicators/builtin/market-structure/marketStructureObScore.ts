// Adapted from © LuxAlgo, Market Structure Break & OB Probability Toolkit. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/market-structure/market_structure_break_OB_probability_toolkit.pinescript
import type { Candle } from "../../../marketData";
import { deviations, smaValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent, type Pivot } from "../../pineSupport";

export function marketStructureObScore(bars: Candle[]) {
  const paint = new DrawingBuilder(), changes = bars.map((bar, i) => i ? bar.close - bars[i - 1].close : NaN), mean = smaValues(changes, 50), sd = deviations(changes, 50);
  let top: Pivot | undefined, bottom: Pivot | undefined, total = 0, mitigated = 0;
  const blocks: { start: number; top: number; bottom: number; bullish: boolean; score: number; end?: number }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], z = sd[i] ? (changes[i] - mean[i]) / sd[i] : NaN;
    top = pivotAt(bars, i, 7) ?? top; bottom = pivotAt(bars, i, 7, 7, false) ?? bottom;
    const bull = !!top && bar.close > top.price && bars[i - 1]?.close <= top.price && z > 0.5;
    const bear = !!bottom && bar.close < bottom.price && bars[i - 1]?.close >= bottom.price && z < -0.5;
    if (bull || bear) {
      const pivot = (bull ? top : bottom)!, color = bull ? BULL : BEAR;
      paint.segment(anchor(pivot.index, pivot.price), anchor(i, pivot.price), color); paint.label((pivot.index + i) / 2, pivot.price, "MSB", color, !bull);
      let source = i;
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) { if (bull ? bars[j].close < bars[j].open : bars[j].close > bars[j].open) { source = j; break; } }
      const previousVolume = bars.slice(Math.max(0, i - 99), i + 1), percentile = previousVolume.length === 100 ? previousVolume.filter(b => b.volume <= bar.volume).length : NaN;
      const score = Math.min(100, Math.abs(z) * 20 + percentile * 0.5);
      if (Number.isFinite(score)) { blocks.push({ start: source, top: bars[source].high, bottom: bars[source].low, bullish: bull, score }); total++; }
      if (bull) { top = undefined; } else { bottom = undefined; }
    }
    for (const block of blocks) { if (block.end === undefined && (block.bullish ? bar.low < block.bottom : bar.high > block.top)) { block.end = i; mitigated++; } }
  }
  let active = 0;
  for (const block of blocks.slice().reverse()) {
    if (block.end === undefined && active++ >= 10) { continue; }
    const color = block.end !== undefined ? "#787b86" : block.score > 80 ? block.bullish ? "#1de9b6" : "#ff5252" : block.bullish ? BULL : BEAR, end = block.end ?? bars.length + 14;
    const box = paint.box(anchor(block.start, block.top), anchor(end, block.bottom), transparent(color, 60), transparent(color, block.end !== undefined ? 90 : block.score > 80 ? 80 : 85)); box.dash = "dashed";
    paint.segment(anchor(block.start, (block.top + block.bottom) / 2), anchor(end, (block.top + block.bottom) / 2), transparent(color, 40), "dashed");
    paint.label(end + 3, (block.top + block.bottom) / 2, `${block.score.toFixed(0)}% score`, color);
  }
  return { ...paint.result("Momentum Z50 > ±0.5 and volume rank100 quality score; the percentage is not win probability. Session sublayers are off by default."), tables: [{ title: "MSB / OB observations", rows: [["Created", String(total)], ["Mitigated", String(mitigated)], ["Mitigation ratio", total ? `${(100 * mitigated / total).toFixed(1)}%` : "—"]] as [string, string][] }] };
}

// Adapted from © LuxAlgo, ICT Unicorn Model. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/fvg-ict/ICT_unicorn_model.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent, type Pivot } from "../../pineSupport";

export function ictUnicorn(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 14), zigzag: Pivot[] = [];
  type Pattern = { start: number; top: number; bottom: number; gapStart: number; gapTop: number; gapBottom: number; swing: number; swingIndex: number; bullish: boolean; active: boolean; trigger?: number; end: number; target?: number; hidden: boolean };
  const patterns: Pattern[] = [];
  for (let i = 1; i < bars.length; i++) {
    for (const high of [true, false]) {
      const pivot = pivotAt(bars, i, 10, 1, high); if (!pivot) { continue; }
      const last = zigzag.at(-1);
      if (last?.high === high) { if (high ? pivot.price > last.price : pivot.price < last.price) { zigzag[zigzag.length - 1] = pivot; } }
      else { zigzag.push(pivot); if (zigzag.length > 4) { zigzag.shift(); } }
    }
    const bar = bars[i];
    for (const pattern of patterns.filter(pattern => pattern.active)) {
      if (pattern.trigger === undefined && (pattern.bullish ? bar.close < pattern.gapBottom : bar.close > pattern.gapTop)) { pattern.active = false; pattern.hidden = true; }
    }
    if (zigzag.length === 4 && zigzag[3].index === i - 1) {
      const [a, b, c, d] = zigzag, bullish = d.high;
      if ((bullish ? bars[i - 1].close > b.price && c.price < a.price : bars[i - 1].close < b.price && c.price > a.price) && d.index - c.index > 1 && c.index - b.index > 1 && b.index - a.index > 1) {
        let breaker = -1;
        for (let j = b.index; j >= Math.max(0, b.index - 4); j--) { if (bullish ? bars[j].close > bars[j].open : bars[j].close < bars[j].open) { breaker = j; break; } }
        if (breaker >= 0) {
          const source = bars[breaker];
          for (let j = i; j >= Math.max(2, c.index); j--) {
            const gapTop = bullish ? bars[j].low : bars[j - 2].low, gapBottom = bullish ? bars[j - 2].high : bars[j].high;
            if (gapTop - gapBottom > atr[i] * 0.05 && (gapTop < source.high && gapTop > source.low || gapBottom < source.high && gapBottom > source.low)) {
              const previous = patterns.filter(pattern => pattern.bullish === bullish).at(-1);
              if (previous?.top !== source.high) {
                for (const pattern of patterns.filter(pattern => pattern.active)) { if (pattern.trigger === undefined) { pattern.hidden = true; } pattern.active = false; }
                patterns.push({ start: breaker, top: source.high, bottom: source.low, gapStart: j - 2, gapTop, gapBottom, swing: c.price, swingIndex: c.index, bullish, active: true, end: i, hidden: false });
              }
              break;
            }
          }
        }
      }
    }
    for (const pattern of patterns.filter(pattern => pattern.active)) {
      pattern.end = i;
      if (pattern.bullish ? bar.low < pattern.swing : bar.high > pattern.swing) { pattern.active = false; continue; }
      if (pattern.target !== undefined) { if (pattern.bullish ? bar.high > pattern.target : bar.low < pattern.target) { pattern.active = false; } continue; }
      const previous = bars[i - 1], trigger = pattern.bullish ? bar.close > pattern.top && bar.open < pattern.top && bar.open > pattern.bottom : bar.close < pattern.bottom && bar.open > pattern.bottom && bar.open < pattern.top;
      if (trigger && Math.max(previous.close, previous.open) > pattern.bottom && Math.min(previous.close, previous.open) < pattern.top) {
        pattern.trigger = i; const entry = pattern.bullish ? pattern.top : pattern.bottom;
        pattern.target = entry + (entry - pattern.swing); paint.label(i, pattern.bullish ? bar.low : bar.high, "● Unicorn", pattern.bullish ? BULL : BEAR, pattern.bullish);
      }
    }
  }
  for (const pattern of patterns.filter(pattern => !pattern.hidden).slice(-40)) {
    const color = pattern.bullish ? BULL : BEAR, end = pattern.trigger ?? pattern.end;
    paint.box(anchor(pattern.start, pattern.top), anchor(pattern.gapStart, pattern.bottom), "#00000000", "#787b8608");
    paint.box(anchor(pattern.gapStart, pattern.gapTop), anchor(end, pattern.gapBottom), "#00000000", transparent(color, 75), "FVG / Unicorn");
    paint.segment(anchor(pattern.start, pattern.top), anchor(end, pattern.top), "#787b86", "dashed"); paint.segment(anchor(pattern.start, pattern.bottom), anchor(end, pattern.bottom), "#787b86", "dashed");
    paint.segment(anchor(pattern.swingIndex, pattern.swing), anchor(pattern.trigger ?? pattern.end, pattern.swing), "#787b86", "dotted");
    if (pattern.trigger !== undefined && pattern.target !== undefined) {
      const entry = pattern.bullish ? pattern.top : pattern.bottom;
      paint.box(anchor(pattern.trigger, entry), anchor(pattern.end + 1, pattern.swing), "#00000000", transparent("#787b86", 80), "Risk");
      paint.box(anchor(pattern.trigger, entry), anchor(pattern.end + 1, pattern.target), "#00000000", transparent("#5b9cf6", 80), "Reward 1:1");
    }
  }
  return paint.result("Default swings10/right1, overlapping breaker/FVG, ATR14 ×0.05 minimum gap, RR1:1, combine off, trailing off. Targets are conditional geometry, not executed orders.");
}

// Adapted from © LuxAlgo, ICT Killzones Toolkit. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/timeframes-sessions/ICT_killzones_toolkit.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, DrawingBuilder, intervalSeconds, legPivots, transparent, type Pivot } from "../../pineSupport";

const SESSIONS = [
  { name: "Asian", start: 1200, end: 1440, color: "#e91e63" },
  { name: "London", start: 120, end: 300, color: "#00bcd4" },
  { name: "New York AM", start: 510, end: 660, color: "#ff5d00" },
  { name: "New York PM", start: 810, end: 960, color: "#2157f3" }
];
export function killzoneAt(time: number) {
  const shifted = new Date((time - 5 * 3600) * 1000), minute = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const session = SESSIONS.find(item => minute >= item.start && minute < item.end);
  return session ? { ...session, key: `${shifted.toISOString().slice(0, 10)}:${session.name}` } : undefined;
}

export function ictKillzones(bars: Candle[], interval: string) {
  const paint = new DrawingBuilder();
  if (intervalSeconds(interval) > 900) { return paint.result("Original default killzones apply to charts of 15m or lower, fixed UTC−5 (no automatic DST). Select a lower interval."); }
  const atr = atrValues(bars, 144), pivots = legPivots(bars, 5);
  let cursor = 0, top: (Pivot & { crossed: boolean }) | undefined, bottom: (Pivot & { crossed: boolean }) | undefined;
  const sessions: { start: number; end: number; high: number; low: number; name: string; color: string; key: string }[] = [];
  let activeKey = "", sessionStart = 0, firstBullFvg = true, firstBearFvg = true, firstBullOb = true, firstBearOb = true;
  const gaps: { start: number; top: number; bottom: number; bullish: boolean; removed: boolean; end: number; extending: boolean }[] = [];
  const blocks: { start: number; top: number; bottom: number; bullish: boolean; removed: boolean; end: number; extending: boolean }[] = [];
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], session = killzoneAt(bar.time), key = session?.key ?? "";
    if (key && key !== activeKey) {
      sessionStart = i; firstBullFvg = true; firstBearFvg = true; firstBullOb = true; firstBearOb = true;
      gaps.forEach(gap => { gap.extending = false; }); blocks.forEach(block => { block.extending = false; });
      sessions.push({ start: i, end: i, high: bar.high, low: bar.low, name: session!.name, color: session!.color, key });
    }
    activeKey = key;
    if (session) { const current = sessions.at(-1)!; current.end = i; current.high = Math.max(current.high, bar.high); current.low = Math.min(current.low, bar.low); }
    while (cursor < pivots.length && pivots[cursor].confirmed <= i) { const pivot = pivots[cursor++]; if (pivot.high) { top = { ...pivot, crossed: false }; } else { bottom = { ...pivot, crossed: false }; } }
    if (session && i >= 2) {
      const threshold = Number.isFinite(atr[i]) ? atr[i] * 1.2 : 0;
      const bullG = bar.low > bars[i - 1].high || bars[i - 1].low > bars[i - 2].high;
      const bearG = bar.high < bars[i - 1].low || bars[i - 1].high < bars[i - 2].low;
      for (const bullish of [true, false]) {
        const gapTop = bullish ? bar.low : bars[i - 2].low, gapBottom = bullish ? bars[i - 2].high : bar.high;
        if ((bullish ? firstBullFvg && !bullG && bars[i - 1].close > gapBottom : firstBearFvg && !bearG && bars[i - 1].close < gapTop) && gapTop - gapBottom > threshold) {
          gaps.push({ start: i - 1, top: gapTop, bottom: gapBottom, bullish, removed: false, end: i, extending: true });
          if (bullish) { firstBullFvg = false; } else { firstBearFvg = false; }
        }
        const pivot = bullish ? top : bottom;
        if (pivot && pivot.index >= sessionStart && !pivot.crossed && (bullish ? bars[i - 1].close > pivot.price : bars[i - 1].close < pivot.price)) {
          pivot.crossed = true;
          if (!(bullish ? firstBullOb : firstBearOb)) { continue; }
          let candidate = i - 1;
          for (let j = i - 1; j > pivot.index; j--) { if (bullish ? bars[j].low <= bars[candidate].low : bars[j].high >= bars[candidate].high) { candidate = j; } }
          blocks.push({ start: candidate, top: bars[candidate].high, bottom: bars[candidate].low, bullish, removed: false, end: i, extending: true });
          if (bullish) { firstBullOb = false; } else { firstBearOb = false; }
        }
      }
    }
    for (const gap of gaps.filter(gap => gap.extending && !gap.removed)) { gap.end = i; if (gap.bullish ? bar.low < gap.bottom : bar.high > gap.top) { gap.removed = true; } }
    if (i > 0) {
      for (const block of blocks.filter(block => block.extending && !block.removed)) { block.end = i; if (block.bullish ? Math.min(bars[i - 1].close, bars[i - 1].open) < block.bottom : Math.max(bars[i - 1].close, bars[i - 1].open) > block.top) { block.removed = true; } }
    }
  }
  sessions.forEach((session, i) => {
    paint.box(anchor(session.start, session.high), anchor(session.end, session.low), transparent(session.color, 100), transparent(session.color, 90));
    paint.label((session.start + session.end) / 2, session.high, session.name, session.color);
    const stop = sessions[i + 1]?.start ?? bars.length - 1;
    for (const price of [session.high, session.low]) { paint.segment(anchor(session.start, price), anchor(stop, price), session.color); }
  });
  gaps.filter(gap => !gap.removed).forEach(gap => paint.box(anchor(gap.start, gap.top), anchor(gap.end, gap.bottom), "#00000000", transparent(gap.bullish ? "#4caf50" : "#f23645", 80), "FVG"));
  blocks.filter(block => !block.removed).forEach(block => paint.box(anchor(block.start, block.top), anchor(block.end, block.bottom), "#00000000", transparent(block.bullish ? "#2157f3" : "#ff5d00", 80), "OB"));
  return paint.result("Original session times in fixed UTC−5; ≤15m. First bullish/bearish OB/FVG per window; FVG ATR144 ×1.2 filter. Optional BB, MSS, mean/open-price layers are off.");
}

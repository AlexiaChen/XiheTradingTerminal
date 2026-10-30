// Adapted from © LuxAlgo, Support Resistance Pro Toolkit. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/support-resistance/support_resistance_pro_toolkit.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, transparent } from "../../pineSupport";

export function supportResistancePro(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 200);
  const levels: { top: number; bottom: number; price: number; start: number; end?: number; support: boolean; entries: number; sweeps: number; volume: number }[] = [];
  let direction = 0, extreme = NaN, extremeIndex = 0, previousHigh = NaN, previousLow = NaN, cumulativeRange = 0, created = 0, broken = 0;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], window = bars.slice(Math.max(0, i - 9), i + 1), high = Math.max(...window.map(b => b.high)), low = Math.min(...window.map(b => b.low));
    cumulativeRange += bar.high - bar.low;
    const oldDirection = direction;
    direction = high > previousHigh ? 1 : low < previousLow ? -1 : direction;
    let pivot: { price: number; index: number; support: boolean } | undefined;
    if (direction !== oldDirection && Number.isFinite(extreme)) { pivot = { price: extreme, index: extremeIndex, support: direction === 1 }; }
    if (direction !== oldDirection || direction === 1 && bar.high >= (Number.isFinite(extreme) ? extreme : -Infinity) || direction === -1 && bar.low <= (Number.isFinite(extreme) ? extreme : Infinity)) { extreme = direction === 1 ? bar.high : bar.low; extremeIndex = i; }
    previousHigh = high; previousLow = low;
    if (pivot) {
      paint.label(pivot.index, pivot.price, pivot.support ? "▲" : "▼", pivot.support ? BULL : BEAR, pivot.support);
      const depth = (Number.isFinite(atr[i]) ? atr[i] : cumulativeRange / (i + 1)) * 0.5;
      const top = pivot.price + (pivot.support ? depth : 0), bottom = pivot.price - (pivot.support ? 0 : depth);
      if (!levels.some(level => level.end === undefined && level.support === pivot.support && Math.max(bottom, level.bottom) < Math.min(top, level.top))) {
        levels.unshift({ top, bottom, price: pivot.price, start: pivot.index, support: pivot.support, entries: 0, sweeps: 0, volume: 0 }); created++;
      }
    }
    for (const level of levels) {
      if (level.end !== undefined) { continue; }
      const color = level.support ? BULL : BEAR;
      if (level.support ? bar.close < level.bottom : bar.close > level.top) { level.end = i; broken++; paint.label(i, level.support ? bar.low : bar.high, "✖", color, level.support); continue; }
      if (bar.high >= level.bottom && bar.low <= level.top) { level.volume += bar.volume; }
      if (level.support ? bar.low <= level.top && bar.close >= level.bottom : bar.high >= level.bottom && bar.close <= level.top) { level.entries++; }
      if (level.support ? bar.low < level.bottom && Math.min(bar.close, bar.open) > level.bottom : bar.high > level.top && Math.max(bar.close, bar.open) < level.top) { level.sweeps++; paint.label(i, level.support ? bar.low : bar.high, "●", color, level.support); }
    }
    if (levels.length > 100) { levels.pop(); }
  }
  let active = 0;
  for (const level of levels) {
    if (level.end === undefined && active++ >= 5) { continue; }
    const end = level.end ?? bars.length + 24, color = level.support ? BULL : BEAR;
    paint.box(anchor(level.start, level.top), anchor(end, level.bottom), "#00000000", transparent(color, 85));
    paint.segment(anchor(level.start, level.price), anchor(end, level.price), color);
    if (level.end === undefined) { paint.label(end, (level.top + level.bottom) / 2, `E:${level.entries} · SW:${level.sweeps} · V:${level.volume.toFixed(0)} · D:${bars.length - 1 - level.start}`, color); }
  }
  return { ...paint.result("Original default Donchian 10, ATR200 × 0.5, oldest overlapping zone takes precedence. Entries count touching bars, not independent trades."), tables: [{ title: "S/R Pro", rows: [["Created zones", String(created)], ["Broken zones", String(broken)], ["Active displayed", String(Math.min(active, 5))]] as [string, string][] }] };
}

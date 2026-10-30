// Adapted from © LuxAlgo, Liquidity Delta Profiler. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/liquidity_delta_profiler.pinescript
import type { Candle } from "../../../marketData";
import { atrValues, smaValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent } from "../../pineSupport";

type Zone = { top: number; bottom: number; start: number; end: number; high: boolean; swept: boolean; signaled: boolean; delta: number[]; volume: number; capacity: number };
type Reaction = { type: string; direction: number; entry: number; start: number; consecutive: number };
export function liquidityDeltaProfiler(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 14), averageVolume = smaValues(bars.map(b => b.volume), 15), zones: Zone[] = [], reactions: Reaction[] = [];
  const stats = new Map(["ABS", "EXH", "DIV", "REJ"].map(type => [type, { total: 0, wins: 0 }]));
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], range = bar.high - bar.low, barDelta = range ? bar.volume * (bar.close - bar.open) / range : 0;
    for (const high of [true, false]) {
      const pivot = pivotAt(bars, i, 15, 15, high); if (!pivot) { continue; }
      const source = bars[pivot.index], minimum = Number.isFinite(atr[pivot.index]) ? atr[pivot.index] * 0.1 : 0;
      const top = high ? source.high : Math.max(Math.min(source.close, source.open), source.low + minimum);
      const bottom = high ? Math.min(Math.max(source.close, source.open), source.high - minimum) : source.low;
      let skip = false;
      for (let j = zones.length - 1; j >= 0; j--) {
        const zone = zones[j];
        if (zone.high === high && !zone.swept && Math.max(bottom, zone.bottom) <= Math.min(top, zone.top)) {
          if (high ? top > zone.top : bottom < zone.bottom) { zones.splice(j, 1); } else { skip = true; break; }
        }
      }
      if (!skip) {
        zones.unshift({ top, bottom, start: pivot.index, end: pivot.index, high, swept: false, signaled: false, delta: [0, 0, 0, 0], volume: 0, capacity: (averageVolume[i] || 1) * 5 });
        const same = zones.filter(zone => zone.high === high);
        if (same.length > 10) { zones.splice(zones.indexOf(same.at(-1)!), 1); }
      }
    }
    for (const zone of zones) {
      if (zone.swept) { continue; }
      zone.end = i;
      const step = (zone.top - zone.bottom) / 4;
      let hit = false;
      for (let q = 0; q < 4; q++) {
        const overlap = Math.max(0, Math.min(bar.high, zone.bottom + (q + 1) * step) - Math.max(bar.low, zone.bottom + q * step));
        if (overlap > 0) { hit = true; const ratio = range ? overlap / range : 0; zone.delta[q] += barDelta * ratio; zone.volume += bar.volume * ratio; }
      }
      const sweeping = zone.high ? bar.high > zone.top : bar.low < zone.bottom;
      zone.swept = sweeping;
      if ((!hit && !sweeping) || zone.signaled) { continue; }
      const abs = zone.delta.reduce((sum, d) => sum + Math.abs(d), 0); if (!abs) { continue; }
      const outer = zone.delta[zone.high ? 3 : 0], ratio = Math.abs(outer) / (abs + 0.0001), inside = bar.close <= zone.top && bar.close >= zone.bottom;
      let type = "";
      if (sweeping && (zone.high ? outer < 0 : outer > 0) && ratio > 0.2) { type = "ABS"; }
      else if (sweeping && ratio < 0.1) { type = "EXH"; }
      else if (inside && ratio > 0.6 && (zone.high ? outer > 0 : outer < 0)) { type = "DIV"; }
      else if (sweeping && (zone.high ? bar.close < (zone.top + zone.bottom) / 2 && barDelta < 0 : bar.close > (zone.top + zone.bottom) / 2 && barDelta > 0) && Math.abs(barDelta) / (bar.volume + 0.0001) > 0.2) { type = "REJ"; }
      if (type) { zone.signaled = true; paint.label(i, zone.high ? bar.high : bar.low, type, zone.high ? BEAR : BULL, !zone.high); reactions.push({ type, direction: zone.high ? -1 : 1, entry: bar.close, start: i, consecutive: 0 }); }
    }
    for (let j = reactions.length - 1; j >= 0; j--) {
      const reaction = reactions[j]; if (i <= reaction.start) { continue; }
      reaction.consecutive = (bar.close - reaction.entry) * reaction.direction > 0 ? reaction.consecutive + 1 : 0;
      if (reaction.consecutive >= 3 || i - reaction.start >= 10) {
        const stat = stats.get(reaction.type)!; stat.total++; if (reaction.consecutive >= 3) { stat.wins++; } reactions.splice(j, 1);
      }
    }
  }
  zones.forEach(zone => {
    const step = (zone.top - zone.bottom) / 4, maximum = Math.max(...zone.delta.map(Math.abs)), color = zone.high ? BEAR : BULL;
    for (let q = 0; q < 4; q++) {
      const delta = zone.delta[q], ink = Math.abs(delta) > 0.001 ? delta > 0 ? BULL : BEAR : color;
      const opacity = zone.swept ? 90 : maximum && Math.abs(delta) > 0.001 ? 100 - Math.trunc(Math.abs(delta) / maximum * 60) : 60 + (zone.high ? 3 - q : q) * 10;
      const box = paint.box(anchor(zone.start, zone.bottom + (q + 0.95) * step), anchor(zone.end, zone.bottom + (q + 0.05) * step), transparent(color, 60), transparent(ink, opacity), delta.toFixed(0));
      if (zone.swept) { box.dash = "dashed"; }
    }
    if (!zone.swept) { paint.label(zone.end + 1, (zone.top + zone.bottom) / 2, `${Math.trunc(Math.max(0, 100 - zone.volume / zone.capacity * 100))}% health`, color); }
  });
  return { ...paint.result("Delta is an OHLCV overlap estimate. ABS/EXH/DIV/REJ observations resolve after 3 consecutive favorable closes or a 10-bar timeout; these are not trade backtest returns."), tables: [{ title: "Liquidity Delta reactions", rows: [...stats].map(([type, stat]): [string, string] => [type, stat.total ? `${stat.wins}/${stat.total} (${(100 * stat.wins / stat.total).toFixed(0)}%)` : "0 resolved"]).concat([["Pending", String(reactions.length)]]) }] };
}

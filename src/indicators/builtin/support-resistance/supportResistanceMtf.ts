// Adapted from © LuxAlgo, Support and Resistance Signals MTF. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/support-resistance/support_and_resistance_signals_MTF.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, transparent } from "../../pineSupport";

type Zone = { start: number; end: number; top: number; bottom: number; margin: number; support: boolean; broken: boolean; tested: boolean; retested: boolean };
export function supportResistanceMtf(bars: Candle[]) {
  const paint = new DrawingBuilder(), resistance: Zone[] = [], support: Zone[] = [], all: Zone[] = [];
  const create = (zone: Zone) => { (zone.support ? support : resistance).unshift(zone); all.push(zone); };
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], window = bars.slice(Math.max(0, i - 14), i + 1), high = Math.max(...window.map(b => b.high)), low = Math.min(...window.map(b => b.low)), margin = high > 0 ? (high - low) / high : 0;
    for (const isSupport of [false, true]) {
      const pivot = pivotAt(bars, i, 15, 15, !isSupport); if (!pivot) { continue; }
      const zones = isSupport ? support : resistance;
      const nearby = zones.slice(0, 2).find(zone => pivot.price >= zone.bottom * (1 - zone.margin * 0.34) && pivot.price <= zone.top * (1 + zone.margin * 0.34));
      if (nearby) { nearby.end = i; }
      else {
        create({ start: pivot.index, end: i, top: pivot.price * (1 + (isSupport ? margin * 0.34 : 0)), bottom: pivot.price * (1 - (isSupport ? 0 : margin * 0.34)), margin, support: isSupport, broken: false, tested: false, retested: false });
        const opposite = isSupport ? resistance[0] : support[0]; if (opposite) { opposite.tested = false; }
      }
    }
    if (!i) { continue; }
    const previous = bars[i - 1];
    // Only the current and previous zone per side are evaluated, as in the reference.
    for (const zones of [resistance, support]) {
      for (const [rank, zone] of zones.slice(0, 2).entries()) {
        const opposite = (zone.support ? resistance : support)[rank], color = zone.support ? BULL : BEAR;
        const broken = zone.support ? previous.close < zone.bottom * (1 - zone.margin * 0.17) : previous.close > zone.top * (1 + zone.margin * 0.17);
        if (broken && !zone.broken) {
          zone.broken = true; zone.retested = false; zone.end = i - 1;
          paint.label(i - 1, zone.support ? previous.high : previous.low, zone.support ? "B ▼" : "▲ B", zone.support ? BEAR : BULL, !zone.support);
          create({ ...zone, start: i - 1, end: i + 1, support: !zone.support, broken: false, tested: false, retested: false });
        } else {
          const contact = zone.support ? previous.low < zone.top && previous.close > zone.bottom && bar.close > zone.bottom : previous.high > zone.bottom && previous.close < zone.top && bar.close < zone.top;
          const retest = !!opposite?.broken && (zone.support ? previous.open > zone.bottom && previous.low < zone.top && previous.close > zone.top : previous.open < zone.top && previous.high > zone.bottom && previous.close < zone.bottom);
          if (retest && !zone.retested && i - 1 !== zone.start) { zone.retested = true; paint.label(i - 1, zone.support ? previous.low : previous.high, "R", color, zone.support); zone.end = i; }
          else if (contact && !zone.tested && !zone.broken && !zone.retested && !opposite?.broken && i - 1 !== zone.start) { zone.tested = true; paint.label(i - 1, zone.support ? previous.low : previous.high, "T", color, zone.support); zone.end = i; }
          else if (!zone.broken && (zone.support ? bar.low < zone.top * (1 + zone.margin * 0.17) : bar.high > zone.bottom * (1 - zone.margin * 0.17))) { zone.end = i; }
        }
        const sweep = !zone.broken && (zone.support ? bar.low < zone.bottom && bar.close >= zone.bottom * (1 - zone.margin * 0.17 * 1.3) : bar.high > zone.top && bar.close <= zone.top * (1 + zone.margin * 0.17 * 1.3));
        if (sweep) {
          const top = zone.support ? zone.bottom : Math.min(bar.high, zone.top * (1 + zone.margin * 0.17 * 1.3));
          const bottom = zone.support ? Math.max(bar.low, zone.bottom * (1 - zone.margin * 0.17 * 1.3)) : zone.top;
          paint.box(anchor(i - 1, top), anchor(i + 1, bottom), "#00000000", transparent(zone.support ? "#2962ff" : "#ff9800", 73));
        }
      }
    }
  }
  all.slice(-150).forEach(zone => {
    const color = zone.support ? BULL : BEAR;
    paint.box(anchor(zone.start, zone.top), anchor(zone.end, zone.bottom), "#00000000", transparent(color, 83));
    paint.segment(anchor(zone.start, zone.support ? zone.bottom : zone.top), anchor(zone.end, zone.support ? zone.bottom : zone.top), transparent(color, 53), undefined, 3);
  });
  return paint.result("Chart-timeframe preset, pivot15 and zone margin2. B/T/R mark buffered break, test and retest with one-bar confirmation. MTF in the source scales lookback; it is not an independent HTF feed. Optional volume/rejection decorations are omitted.");
}

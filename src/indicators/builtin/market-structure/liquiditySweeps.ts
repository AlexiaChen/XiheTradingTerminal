// Adapted from © LuxAlgo, Liquidity Sweeps. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/market-structure/liquidity_sweeps.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt, type Pivot } from "../../pineSupport";

export function liquiditySweeps(bars: Candle[]) {
  const paint = new DrawingBuilder();
  const levels: (Pivot & { swept: boolean })[] = [];
  const zones: { box: ReturnType<DrawingBuilder["box"]>; direction: number; start: number; stopped: boolean }[] = [];
  bars.forEach((bar, i) => {
    for (const high of [true, false]) { const pivot = pivotAt(bars, i, 5, 5, high); if (pivot) { levels.push({ ...pivot, swept: false }); } }
    for (let j = levels.length - 1; j >= 0; j--) {
      const level = levels[j], broken = level.high ? bar.close > level.price : bar.close < level.price;
      if (!broken && !level.swept && (level.high ? bar.high > level.price && bar.close < level.price : bar.low < level.price && bar.close > level.price)) {
        const color = level.high ? BEAR : BULL, wick = level.high ? bar.high : bar.low;
        const zone = paint.box(anchor(i - 1, wick), anchor(i + 1, level.price), "#00000000", `${color}41`);
        paint.segment(anchor(i, wick), anchor(i, level.price), color, undefined, 3);
        paint.segment(anchor(level.index, level.price), anchor(i, level.price), `${color}80`, "dotted");
        const opposite = level.high ? bar.low : bar.high;
        paint.segment(anchor(i, opposite), anchor(i + 3, opposite), color, "dotted");
        paint.label(i, wick, "Sweep", color, !level.high);
        zones.push({ box: zone, direction: level.high ? 1 : -1, start: i - 1, stopped: false }); level.swept = true;
      }
      if (broken || i - level.index > 2000) { levels.splice(j, 1); }
    }
    for (const zone of zones) {
      if (!zone.stopped && i - zone.start - 1 <= 300) {
        zone.box.to.index = i;
        zone.stopped = zone.direction === 1 ? bar.close > Math.max(zone.box.from.price, zone.box.to.price) : bar.close < Math.min(zone.box.from.price, zone.box.to.price);
      }
    }
  });
  return paint.result("Original default: 5-bar pivots, Only Wicks, extend zones up to 300 bars. Origin pivots are retrospective.");
}

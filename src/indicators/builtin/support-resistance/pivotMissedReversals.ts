// Adapted from © LuxAlgo, Pivot Points High Low & Missed Reversal Levels. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/support-resistance/pivot_points_high_low_missed_reversal_levels.pinescript
import type { Candle } from "../../../marketData";
import { anchor, DrawingBuilder, pivotAt, transparent } from "../../pineSupport";

export function pivotMissedReversals(bars: Candle[]) {
  const paint = new DrawingBuilder(), length = 50, red = "#ef5350", green = "#26a69a";
  let max = -Infinity, min = Infinity, maxIndex = 0, minIndex = 0, followMax = -Infinity, followMin = Infinity, followMaxIndex = 0, followMinIndex = 0;
  let direction = 0, previous = anchor(0, bars[0]?.close ?? 0), ghost: { start: number; end: number; price: number; color: string } | undefined;
  const ghosts: NonNullable<typeof ghost>[] = [];
  const missed = (index: number, price: number, high: boolean, color: string) => {
    if (!Number.isFinite(price)) { return; }
    paint.label(index, price, "👻", high ? red : green, !high);
    paint.segment(previous, anchor(index, price), color, "dashed");
    if (ghost) { ghost.end = index; }
    previous = anchor(index, price); ghost = { start: index, end: index, price, color: high ? red : green }; ghosts.push(ghost);
  };
  for (let i = length; i < bars.length; i++) {
    const source = bars[i - length], oldMax = max, oldMin = min, oldFollowMax = followMax, oldFollowMin = followMin;
    max = Math.max(source.high, max); min = Math.min(source.low, min);
    followMax = Math.max(source.high, followMax); followMin = Math.min(source.low, followMin);
    if (max > oldMax) { maxIndex = i - length; followMin = source.low; }
    if (min < oldMin) { minIndex = i - length; followMax = source.high; }
    if (followMin < oldFollowMin) { followMinIndex = i - length; }
    if (followMax > oldFollowMax) { followMaxIndex = i - length; }
    if (ghost) { ghost.end = i; }
    const high = pivotAt(bars, i, length), low = pivotAt(bars, i, length, length, false);
    if (high) {
      if (direction === 1) { missed(minIndex, min, false, red); }
      else if (high.price < max) { missed(maxIndex, max, true, green); missed(followMinIndex, followMin, false, red); }
      paint.label(high.index, high.price, "▼", red); paint.segment(previous, anchor(high.index, high.price), green, high.price < max || direction === 1 ? "dashed" : undefined);
      previous = anchor(high.index, high.price); direction = 1; max = high.price; min = high.price;
    }
    if (low) {
      if (direction === 0) { missed(maxIndex, max, true, green); }
      else if (low.price > min) { missed(minIndex, min, false, red); missed(followMaxIndex, followMax, true, green); }
      paint.label(low.index, low.price, "▲", green, true); paint.segment(previous, anchor(low.index, low.price), red, low.price > min || direction === 0 ? "dashed" : undefined);
      previous = anchor(low.index, low.price); direction = 0; max = low.price; min = low.price;
    }
  }
  ghosts.forEach(level => paint.segment(anchor(level.start, level.price), anchor(level.end, level.price), transparent(level.color, 50), undefined, 2));
  if (previous.index > 0 && previous.index < bars.length - 1) {
    let index = previous.index + 1;
    for (let i = index + 1; i < bars.length; i++) { if (direction ? bars[i].low < bars[index].low : bars[i].high > bars[index].high) { index = i; } }
    const price = direction ? bars[index].low : bars[index].high;
    paint.label(index, price, "👻 live", direction ? green : red, !!direction);
    paint.segment(previous, anchor(index, price), direction ? red : green, "dashed");
    paint.segment(anchor(index, price), anchor(bars.length - 1, price), transparent(direction ? red : green, 50), undefined, 2);
  }
  return paint.result("Pivot length 50: origin labels arrive 50 bars later. The latest ghost is a moving estimate, not a confirmed reversal.");
}

// Pine-specific leg/fractal helpers adapted from © LuxAlgo. CC BY-NC-SA 4.0.
// Attribution and scope: third-party/indicator-adaptations-NOTICE.txt
import type { Candle } from "../marketData";
import type { Anchor, BuiltinResult, IndicatorDrawing } from "./types";

export const BULL = "#089981", BEAR = "#f23645", NEUTRAL = "#787b86";
export const anchor = (index: number, price: number): Anchor => ({ index, price });
/** Pine transparency is the inverse of CSS opacity. Eight-digit hex already contains opacity. */
export function transparent(hex: string, transparency: number) {
  return `${hex.slice(0, 7)}${Math.round((1 - Math.max(0, Math.min(100, transparency)) / 100) * 255).toString(16).padStart(2, "0")}`;
}
export type Pivot = { index: number; price: number; confirmed: number; high: boolean };

/** LuxAlgo leg detector compares an old extreme only against the following `length` bars. */
export function legPivots(bars: Candle[], length: number): Pivot[] {
  const output: Pivot[] = [];
  let leg = 0;
  for (let i = length; i < bars.length; i++) {
    const source = bars[i - length], following = bars.slice(i - length + 1, i + 1);
    const next = source.high > Math.max(...following.map(b => b.high)) ? 0 : source.low < Math.min(...following.map(b => b.low)) ? 1 : leg;
    if (next !== leg) { output.push({ index: i - length, price: next ? source.low : source.high, confirmed: i, high: !next }); }
    leg = next;
  }
  return output;
}

export function pivotAt(bars: Candle[], confirmed: number, left: number, right = left, high = true): Pivot | undefined {
  const index = confirmed - right;
  if (index < left || right < 0 || left < 1 || confirmed >= bars.length) { return; }
  const value = (bar: Candle) => high ? bar.high : -bar.low;
  const center = value(bars[index]);
  if (!Number.isFinite(center) || bars.slice(index - left, confirmed + 1).some(bar => !Number.isFinite(value(bar)))) { return; }
  if (bars.slice(index - left, index).some(bar => value(bar) > center) || bars.slice(index + 1, confirmed + 1).some(bar => value(bar) >= center)) { return; }
  return { index, price: high ? center : -center, confirmed, high };
}

/** ICT three-level pattern hierarchy; availability stays at the confirming observation. */
export function hierarchy(bars: Candle[], depth: number, high: boolean): Pivot[] {
  let values: Pivot[] = bars.map((bar, index) => ({ index, price: high ? bar.high : bar.low, confirmed: index, high }));
  for (let level = 0; level < depth; level++) {
    const next: Pivot[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      const a = values[i - 1], b = values[i], c = values[i + 1];
      if (high ? a.price < b.price && b.price >= c.price : a.price > b.price && b.price <= c.price) {
        next.push({ ...b, confirmed: c.confirmed });
      }
    }
    values = next;
  }
  return values;
}

/** The reference liquidity/OB variant consumes two older points after a fractal promotion. */
export function fractalHierarchy(bars: Candle[], depth: number, high: boolean): Pivot[] {
  const levels = Array.from({ length: depth }, () => [] as Pivot[]), result: Pivot[] = [];
  bars.forEach((bar, index) => {
    levels[0].unshift({ index, price: high ? bar.high : bar.low, confirmed: index, high });
    if (levels[0].length > 3) { levels[0].pop(); }
    for (let level = 0; level < depth; level++) {
      const points = levels[level]; if (points.length !== 3) { continue; }
      const middle = points[1];
      if (high ? middle.price >= points[0].price && middle.price >= points[2].price : middle.price <= points[0].price && middle.price <= points[2].price) {
        if (level === depth - 1) { result.push({ ...middle, confirmed: index }); }
        else { levels[level + 1].unshift(middle); if (levels[level + 1].length > 3) { levels[level + 1].pop(); } }
        points.pop(); points.pop();
      }
    }
  });
  return result;
}

/** Draw descriptions are portable, bounded and re-created deterministically from a candle snapshot. */
export class DrawingBuilder {
  readonly drawings: IndicatorDrawing[] = [];
  segment(from: Anchor, to: Anchor, color: string, dash?: "dashed" | "dotted", width = 1) {
    this.drawings.push({ id: `line-${this.drawings.length}`, kind: "segment", from, to, color, dash, width });
  }
  box(from: Anchor, to: Anchor, color: string, fill = transparent(color, 85), text?: string) {
    const item: IndicatorDrawing & { kind: "box" } = { id: `box-${this.drawings.length}`, kind: "box", from, to, color, fill, text };
    this.drawings.push(item); return item;
  }
  label(index: number, price: number, text: string, color: string, below = false, tooltip?: string) {
    this.drawings.push({ id: `label-${this.drawings.length}`, kind: "label", at: anchor(index, price), text, color, position: below ? "below" : "above", tooltip });
  }
  result(notice?: string): BuiltinResult { return { plots: [], drawings: this.drawings.slice(-1500), notice: this.drawings.length > 1500 ? `${notice ?? ""} Drawings limited to the latest 1,500 objects.`.trim() : notice }; }
}

export const intervalSeconds = (interval: string) => interval === "D" ? 86400 : interval === "W" ? 604800 : Number(interval) * 60;
export function indexAt(bars: Candle[], time: number): number {
  let low = 0, high = bars.length;
  while (low < high) { const mid = (low + high) >>> 1; if (bars[mid].time < time) { low = mid + 1; } else { high = mid; } }
  return low;
}

/** UTC aggregation boundaries, including Monday-anchored weeks; not an exchange-session calendar. */
export function bucket(time: number, seconds: number) {
  const offset = seconds === 604800 ? 345600 : 0;
  return Math.floor((time - offset) / seconds) * seconds + offset;
}
export function aggregate(bars: Candle[], seconds: number): Candle[] {
  const output: Candle[] = [];
  for (const bar of bars) {
    const time = bucket(bar.time, seconds), last = output.at(-1);
    if (last?.time === time) { last.high = Math.max(last.high, bar.high); last.low = Math.min(last.low, bar.low); last.close = bar.close; last.volume += bar.volume; }
    else { output.push({ ...bar, time }); }
  }
  // A clipped first source candle must never become a supposedly complete HTF anchor.
  if (bars.length && output[0].time < bars[0].time) { output.shift(); }
  return output;
}

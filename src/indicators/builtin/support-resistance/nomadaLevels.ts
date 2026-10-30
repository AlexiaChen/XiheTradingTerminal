// Algorithm adaptation of the supplied NomadaScalper 1.4.0 reference.
// The reference has no local license declaration; attribution is retained, no MIT claim is made.
// Source: third-party/tradingview-indicator/support-resistance/sellside_buyside_nomada_scalper.pinescript
import type { Candle } from "../../../marketData";
import type { IndicatorContext } from "../../types";
import { aggregate, anchor, DrawingBuilder, indexAt, intervalSeconds, transparent } from "../../pineSupport";

export function nomadaLevels(bars: Candle[], interval: string, context?: IndicatorContext) {
  const paint = new DrawingBuilder(), seconds = intervalSeconds(interval), n = bars.length - 1;
  if (!bars.length || seconds > 14400 || 14400 % seconds !== 0) { return paint.result("Use H4 or a lower timeframe dividing H4; this is a completed-candle level map."); }
  const source = context?.series.get("4h") ?? aggregate(bars, 14400);
  type Level = { price: number; high: boolean; origin: number; observed: number; reached?: number; depth: number };
  const levels: Level[] = [];
  for (const candle of source.slice(-121)) {
    const observed = indexAt(bars, candle.time + 14400);
    if (observed >= bars.length) { continue; }
    for (const high of [true, false]) {
      const price = high ? candle.high : candle.low;
      let origin = bars.findIndex(bar => bar.time >= candle.time && bar.time < candle.time + 14400 && (high ? bar.high : bar.low) === price);
      if (origin < 0) { origin = observed; }
      let reached: number | undefined;
      // Source candles before the loaded chart still retire at the first known H4 contact.
      const previousHit = source.some(later => later.time >= candle.time + 14400 && later.time + 14400 <= bars[0].time && (high ? later.high >= price : later.low <= price));
      if (previousHit) { continue; }
      for (let i = observed; i < bars.length; i++) { if (high ? bars[i].high >= price : bars[i].low <= price) { reached = i; break; } }
      levels.push({ price, high, origin, observed, reached, depth: (candle.high - candle.low) * 0.025 });
    }
  }
  const deduplicate = (values: Level[]) => values.filter((item, i) => values.findIndex(other => other.price === item.price && other.high === item.high) === i);
  const current = bars[n].close;
  const selected = [true, false].flatMap(high => deduplicate(levels.filter(level => level.high === high && level.reached === undefined).reverse()).sort((a, b) => Math.abs(a.price - current) - Math.abs(b.price - current)).slice(0, 3));
  const reached = deduplicate(levels.filter(level => level.reached !== undefined).reverse()).sort((a, b) => b.reached! - a.reached!).slice(0, 6);
  const draw = (level: Level, color: string, text: string) => {
    const end = level.reached ?? n + 13, ink = level.reached === undefined ? color : transparent(color, 60);
    if (level.origin < level.observed) { paint.segment(anchor(level.origin, level.price), anchor(level.observed, level.price), transparent(color, 45), "dotted"); }
    paint.segment(anchor(level.observed, level.price), anchor(end, level.price), ink, level.reached === undefined ? undefined : "dotted", 2);
    paint.label(level.origin, level.price, "✦", ink, !level.high);
    paint.label(end, level.price, `${text} ${level.price.toPrecision(7)}${level.reached === undefined ? "" : " · reached"}`, ink, !level.high);
    if (level.depth) { paint.box(anchor(level.observed, level.price), anchor(end, level.price + (level.high ? -level.depth : level.depth)), "#00000000", transparent(color, 90)); }
  };
  const light = context?.theme === "light";
  [...reached, ...selected].forEach(level => draw(level, level.high ? light ? "#287D6A" : "#79BFA8" : light ? "#B35265" : "#D78B94", "H4"));
  for (const [tf, duration, colors, name] of [["1w", 604800, [light ? "#A77624" : "#DCB66D", light ? "#A77624" : "#DCB66D"], "W"], ["1d", 86400, [light ? "#2476C7" : "#68B3FF", light ? "#B89C12" : "#F2D84B"], "D"]] as const) {
    const completed = (context?.series.get(tf) ?? aggregate(bars, duration)).filter(bar => bar.time + duration <= bars[n].time).at(-1);
    if (!completed) { continue; }
    for (const high of [true, false]) {
      const price = high ? completed.high : completed.low, observed = indexAt(bars, completed.time + duration);
      if (observed > n) { continue; }
      const touched = bars.findIndex((bar, i) => i >= observed && (high ? bar.high >= price : bar.low <= price));
      const origin = bars.findIndex(bar => bar.time >= completed.time && bar.time < completed.time + duration && (high ? bar.high : bar.low) === price);
      draw({ price, high, origin: origin < 0 ? observed : origin, observed, reached: touched < 0 ? undefined : touched, depth: 0 }, colors[high ? 0 : 1], name);
    }
  }
  return paint.result("Completed H4 levels only; solid starts at availability, dotted origin is retrospective. Contacts before loaded chart history have source-candle resolution.");
}

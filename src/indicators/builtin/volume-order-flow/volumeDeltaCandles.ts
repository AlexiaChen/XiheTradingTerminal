// Adapted from © LuxAlgo, Volume Delta Candles. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/volume_delta_candles.pinescript
import type { Candle } from "../../../marketData";
import type { IndicatorContext } from "../../types";
import { anchor, BEAR, BULL, DrawingBuilder, intervalSeconds, transparent } from "../../pineSupport";
import { intrabarGroups } from "../../intrabars";

export function volumeDeltaCandles(bars: Candle[], interval: string, context?: IndicatorContext) {
  const paint = new DrawingBuilder(), seconds = intervalSeconds(interval);
  if (seconds < 60) { return paint.result("Second-based intrabars and realtime tick mode are unavailable from this provider."); }
  const lower = seconds === 60 ? bars : context?.series.get("1m") ?? [];
  const groups = intrabarGroups(bars, lower, seconds, 60);
  for (const [i, bar] of bars.entries()) {
    const children = groups.get(bar.time); if (!children || !bar.volume) { continue; }
    const buy = children.reduce((sum, child) => sum + (child.close > child.open ? child.volume : 0), 0);
    const sell = children.reduce((sum, child) => sum + (child.close < child.open ? child.volume : 0), 0);
    const normalized = (buy - sell) / bar.volume, size = Math.abs(bar.open - bar.close), low = Math.min(bar.open, bar.close), high = Math.max(bar.open, bar.close);
    const base = normalized >= 0 ? low : high, value = normalized >= 0 ? low + Math.abs(normalized) * size : high - Math.abs(normalized) * size;
    paint.box(anchor(i - 0.32, base), anchor(i + 0.32, value), "#00000000", transparent(normalized > 0 ? BULL : BEAR, 50));
  }
  return { ...paint.result(`LTF mode, 1m polarity data: ${groups.size}/${bars.length} chart bars covered. Uncovered bars are omitted. Tick mode cannot be reconstructed; Gruvbox candle outlines are retained.`), tables: [{ title: "Volume Delta coverage", rows: [["Source", "1m candle polarity"], ["Chart bars covered", `${groups.size}/${bars.length}`], ["Tick mode", "Unavailable"]] as [string, string][] }] };
}

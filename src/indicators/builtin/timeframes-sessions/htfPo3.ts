// Adapted from © LuxAlgo, HTF PO3. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/timeframes-sessions/htf_po3.pinescript
import type { Candle } from "../../../marketData";
import { anchor, BEAR, bucket, BULL, DrawingBuilder, intervalSeconds, NEUTRAL } from "../../pineSupport";

export function htfPo3(bars: Candle[], interval: string) {
  const paint = new DrawingBuilder(), seconds = intervalSeconds(interval), n = bars.length - 1;
  if (!bars.length || seconds > 3600 || 3600 % seconds) { return paint.result("Original HTF is 1H. Select a chart interval at or below 1H that divides 1H."); }
  const time = bucket(bars[n].time, 3600), start = bars.findIndex(bar => bar.time >= time);
  if (start < 0 || bars[start].time !== time) { return paint.result("The forming 1H candle starts before loaded history; waiting for a complete origin."); }
  const window = bars.slice(start), open = window[0].open, close = window.at(-1)!.close;
  const high = Math.max(...window.map(bar => bar.high)), low = Math.min(...window.map(bar => bar.low));
  const highIndex = start + window.findIndex(bar => bar.high === high), lowIndex = start + window.findIndex(bar => bar.low === low), x = n + 15;
  const color = close >= open ? BULL : BEAR;
  paint.segment(anchor(x + 3, high), anchor(x + 3, low), color, undefined, 2);
  paint.box(anchor(x, Math.max(open, close)), anchor(x + 6, Math.min(open, close)), color, color);
  for (const [index, price, name, ink] of [[start, open, "Open", NEUTRAL], [highIndex, high, "High", BULL], [lowIndex, low, "Low", BEAR], [n, close, "Close", color]] as const) {
    paint.segment(anchor(index, price), anchor(x, price), ink, "dashed"); paint.label(x + 12, price, `${name}: ${price.toPrecision(6)}`, ink);
  }
  const delta = window.reduce((sum, bar) => sum + (bar.close > bar.open ? bar.volume : bar.close < bar.open ? -bar.volume : 0), 0);
  paint.label(x + 3, high, "1H · forming", NEUTRAL);
  paint.label(x + 3, low, `Δ ${delta.toFixed(1)}`, delta >= 0 ? BULL : BEAR, true);
  return paint.result("Live 1H OHLC projection, not a price forecast. Running delta uses chart-bar polarity, not trade-side data.");
}

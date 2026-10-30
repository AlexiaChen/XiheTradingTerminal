// Adapted from © LuxAlgo, HTF Reversal & Divergences. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/timeframes-sessions/HTF_reversal_divergences.pinescript
import type { Candle } from "../../../marketData";
import type { BuiltinPlot, IndicatorContext } from "../../types";
import { aggregate, anchor, BEAR, BULL, DrawingBuilder, indexAt, intervalSeconds, pivotAt, transparent } from "../../pineSupport";
import { rsi } from "../momentum/rsi";

export function htfReversalDivergences(bars: Candle[], interval: string, context?: IndicatorContext) {
  const paint = new DrawingBuilder(), values = new Map(rsi(bars).map(point => [point.time, point.value]));
  const oscillatorBars = bars.map(bar => ({ ...bar, high: values.get(bar.time) ?? NaN, low: values.get(bar.time) ?? NaN }));
  const plots: BuiltinPlot[] = [{ name: "HTF RSI14", type: "line", color: BULL, width: 2, pane: 1, data: bars.filter(bar => values.has(bar.time)).map(bar => ({ time: bar.time, value: values.get(bar.time), color: values.get(bar.time)! > 50 ? BULL : BEAR })) }];
  for (const [level, color] of [[30, BULL], [50, "#787b86"], [70, BEAR]] as const) { plots.push({ name: `RSI ${level}`, type: "line", color: transparent(color, 50), style: "dashed", pane: 1, data: bars.map(bar => ({ time: bar.time, value: level })) }); }
  for (const high of [true, false]) {
    let previous: { index: number; rsi: number; price: number } | undefined;
    for (let i = 24; i < bars.length; i++) {
      const pivot = pivotAt(oscillatorBars, i, 5, 5, high); if (!pivot) { continue; }
      const current = { index: pivot.index, rsi: pivot.price, price: high ? bars[pivot.index].high : bars[pivot.index].low };
      if (previous && (high ? current.rsi < previous.rsi && current.price > previous.price : current.rsi > previous.rsi && current.price < previous.price)) {
        const color = high ? BEAR : BULL;
        paint.segment(anchor(previous.index, previous.price), anchor(current.index, current.price), color, undefined, 2); paint.label(current.index, current.price, high ? "Bear Div" : "Bull Div", color, !high);
        paint.segment(anchor(previous.index, previous.rsi), anchor(current.index, current.rsi), color, undefined, 2); paint.drawings.at(-1)!.pane = 1;
      }
      previous = current;
    }
  }
  const seconds = intervalSeconds(interval), source = context?.series.get("15m") ?? (seconds <= 900 ? aggregate(bars, 900) : []);
  if (seconds <= 900) {
    for (let i = 1; i < source.length; i++) {
      const a = source[i - 1], b = source[i];
      if (!bars.length || b.time + 900 > bars.at(-1)!.time) { continue; }
      const bullishEngulfing = b.close > b.open && a.close < a.open && b.close >= a.open && b.open <= a.close;
      const bearishEngulfing = b.close < b.open && a.close > a.open && b.close <= a.open && b.open >= a.close;
      const hammer = Math.min(b.open, b.close) - b.low > (b.high - b.low) * 0.6 && Math.abs(b.close - b.open) < (b.high - b.low) * 0.3;
      const star = b.high - Math.max(b.open, b.close) > (b.high - b.low) * 0.6 && Math.abs(b.close - b.open) < (b.high - b.low) * 0.3;
      if (!bullishEngulfing && !bearishEngulfing && !hammer && !star) { continue; }
      const left = indexAt(bars, b.time), right = indexAt(bars, b.time + 900), color = bullishEngulfing || hammer ? BULL : BEAR;
      if (left >= bars.length) { continue; }
      paint.box(anchor(left, b.high), anchor(right, b.low), transparent(color, 50), transparent(color, 90));
      paint.box(anchor(left + (right - left) * 0.1, Math.max(b.open, b.close)), anchor(right - (right - left) * 0.1, Math.min(b.open, b.close)), transparent(color, 20), transparent(color, 60));
      paint.label((left + right) / 2, bullishEngulfing || hammer ? b.low : b.high, bullishEngulfing ? "Bull Engulfing" : bearishEngulfing ? "Bear Engulfing" : hammer ? "Hammer" : "Shooting Star", color, bullishEngulfing || hammer);
    }
  }
  return { ...paint.result(`RSI divergence confirms after 5 bars. ${seconds > 900 ? "15m HTF patterns require a chart interval at or below 15m; only RSI is shown." : "HTF marks are published after source close; this normalizes the source's lookahead_off/[1] historical/live delivery difference."} Optional PO3 is off by default.`), plots };
}

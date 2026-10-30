// Adapted from © LuxAlgo, Evasive SuperTrend. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/trend/evasive_supertrend.pinescript
import type { Candle } from "../../../marketData";
import type { BuiltinPlot, BuiltinResult } from "../../types";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, transparent } from "../../pineSupport";

export function evasiveSupertrend(bars: Candle[]): BuiltinResult {
  const atr = atrValues(bars, 10), paint = new DrawingBuilder();
  const plots: BuiltinPlot[] = [false, true].map(noisy => ({ name: noisy ? "Evasive band" : "Supertrend band", color: BULL, type: "line", style: noisy ? "dotted" : undefined, width: 2, data: [] }));
  let band = NaN, trend = 1;
  for (let i = 0; i < bars.length; i++) {
    if (!Number.isFinite(atr[i])) { continue; }
    const bar = bars[i], middle = (bar.high + bar.low) / 2, upper = middle + atr[i] * 3, lower = middle - atr[i] * 3;
    const previous = Number.isFinite(band) ? band : trend === 1 ? lower : upper;
    const noisy = Math.abs(bar.close - previous) < atr[i], oldTrend = trend;
    band = trend === 1 ? noisy ? previous - atr[i] * 0.5 : Math.max(lower, previous) : noisy ? previous + atr[i] * 0.5 : Math.min(upper, previous);
    if (trend === 1 && bar.close < band) { trend = -1; band = upper; }
    else if (trend === -1 && bar.close > band) { trend = 1; band = lower; }
    const color = trend === 1 ? BULL : BEAR;
    plots.forEach((plot, index) => plot.data.push({ time: bar.time, ...(index === Number(noisy) ? { value: band, color } : {}) }));
    if (oldTrend !== trend) { paint.label(i, band, trend === 1 ? "● BULL" : "● BEAR", color, trend === 1); }
    if (i > 9) {
      paint.drawings.push({ id: `gradient-${i}`, kind: "fill", color: transparent(color, trend === 1 ? 50 : 100), bottomColor: transparent(color, trend === 1 ? 100 : 50), top: [anchor(i - 0.5, Math.max(middle, band)), anchor(i + 0.5, Math.max(middle, band))], bottom: [anchor(i - 0.5, Math.min(middle, band)), anchor(i + 0.5, Math.min(middle, band))] });
    }
  }
  return { ...paint.result(), plots };
}

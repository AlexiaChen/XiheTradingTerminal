// Adapted from © LuxAlgo, Swing Breakouts Tests & Retests. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/support-resistance/breakouts_with_tests_retests.pinescript
import type { Candle } from "../../../marketData";
import { atrValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, pivotAt } from "../../pineSupport";

export function breakoutsTestsRetests(bars: Candle[]) {
  const paint = new DrawingBuilder(), atr = atrValues(bars, 200);
  for (const bullish of [true, false]) {
    let zone: ReturnType<DrawingBuilder["box"]> | undefined, state = 0, lastTest = -1, sum = 0;
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]; sum += bar.high - bar.low;
      const width = Number.isFinite(atr[i]) ? atr[i] : sum / (i + 1);
      const pivot = pivotAt(bars, i, 10, 1, !bullish);
      if (!state) {
        if (pivot) {
          const top = pivot.price + (bullish ? width : 0), bottom = pivot.price - (bullish ? 0 : width), color = bullish ? BULL : BEAR;
          zone = paint.box(anchor(i - 1, top), anchor(i, bottom), "#00000000", `${color}45`); state = 1; lastTest = -1;
        }
        continue;
      }
      if (!zone) { continue; }
      const top = zone.from.price, bottom = zone.to.price;
      if (zone.to.index - zone.from.index >= 500) {
        if (lastTest < 0) { zone.fill = "#00000000"; } else { zone.to.index = lastTest; }
        state = 0; continue;
      }
      zone.to.index = i;
      if (state === 1 && (bullish ? bar.close < bottom : bar.close > top)) {
        zone = paint.box(anchor(i, top), anchor(i, bottom), "#00000000", `${bullish ? BEAR : BULL}45`); state = 2; lastTest = -1;
      } else if (state === 2 && (bullish ? bar.close > top : bar.close < bottom)) { state = 0; }
      else if (state === 1 ? bullish ? bar.close > top && bar.open < top : bar.close < bottom && bar.open > bottom : bullish ? bar.close < bottom && bar.open > bottom : bar.close > top && bar.open < top) {
        const up = state === 1 ? bullish : !bullish;
        paint.label(i, up ? top : bottom, state === 1 ? up ? "▲ Test" : "▼ Test" : up ? "△ Retest" : "▽ Retest", up ? BULL : BEAR, up); lastTest = i;
      }
    }
  }
  return paint.result("Default left/right 10/1; width ATR200 with cumulative range fallback. Zones stop after 500 bars without a signal.");
}

// Adapted from © LuxAlgo, Delta Flow Profile. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/delta_flow_profile.pinescript
import type { Candle } from "../../../marketData";
import { anchor, DrawingBuilder, transparent } from "../../pineSupport";
import { profileBins } from "../../volumeProfileMath";
import type { Anchor } from "../../types";

export function deltaFlowProfile(bars: Candle[]) {
  const paint = new DrawingBuilder(), window = bars.slice(-360), n = bars.length - 1;
  if (window.length < 10) { return paint.result("At least 10 bars are required."); }
  const low = Math.min(...window.map(b => b.low)), high = Math.max(...window.map(b => b.high));
  const { total, buy, step } = profileBins(window, 25, low, high, true), max = Math.max(...total);
  if (!(max > 0 && step > 0)) { return paint.result("Profile needs non-zero volume and price range."); }
  const start = n - window.length + 1, points: Anchor[] = [], rolling = Array<number>(25).fill(0);
  window.forEach((bar, i) => {
    const sample = profileBins([bar], 25, low, high, true).total;
    sample.forEach((value, k) => { rolling[k] += value; });
    points.push(anchor(start + i, low + (rolling.indexOf(Math.max(...rolling)) + 0.5) * step));
  });
  total.forEach((volume, row) => {
    const ratio = volume / max, top = low + (row + 1) * step, bottom = low + row * step, delta = 2 * buy[row] - volume;
    paint.box(anchor(n + 13, top), anchor(n + 13 + window.length * 0.17 * ratio, bottom), "#00000000", transparent("#5288C4", 93 - 40 * ratio));
    paint.box(anchor(n + 13, top), anchor(n + 13 - window.length * 0.17 * Math.abs(delta) / max, bottom), "#00000000", transparent(delta >= 0 ? "#5288C4" : "#f7525f", 40));
  });
  paint.drawings.push({ id: "developing-poc", kind: "path", points, color: transparent("#f23645", 25), width: 2 });
  return paint.result("360-bar money-flow profile: volume × bin price. Delta is estimated using candle polarity, not aggressor order flow. Developing POC uses the latest window bounds.");
}

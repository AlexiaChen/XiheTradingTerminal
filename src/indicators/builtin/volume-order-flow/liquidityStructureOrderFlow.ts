// Adapted from © LuxAlgo, Liquidity Structure & Order Flow. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/liquidity_structure_order_flow.pinescript
import type { Candle } from "../../../marketData";
import { deviations, emaValues, smaValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder, transparent } from "../../pineSupport";
import { valueArea } from "../../volumeProfileMath";
import type { Anchor } from "../../types";

export function liquidityStructureOrderFlow(bars: Candle[]) {
  const paint = new DrawingBuilder(), window = bars.slice(-300), n = bars.length - 1;
  if (window.length < 50) { return paint.result("At least 50 bars are required; unusual-volume statistics warm up after 200."); }
  const low = Math.min(...window.map(b => b.low)), high = Math.max(...window.map(b => b.high)), step = (high - low) / 150;
  if (!(step > 0)) { return paint.result("Profile needs a non-zero price range."); }
  const raw = Array<number>(150).fill(0), delta = Array<number>(150).fill(0);
  const smoothDelta = emaValues(bars.map(b => b.close > b.open ? b.volume : b.close < b.open ? -b.volume : 0), 5);
  let buy = 0, sell = 0;
  window.forEach((bar, i) => {
    const bin = Math.max(0, Math.min(149, Math.trunc((bar.close - low) / step)));
    raw[bin] += bar.volume; delta[bin] += smoothDelta[bars.length - window.length + i];
    if (bar.close > bar.open) { buy += bar.volume; } else if (bar.close < bar.open) { sell += bar.volume; }
  });
  const smooth = raw.map((_, k) => {
    let sum = 0, weight = 0;
    for (let j = Math.max(0, k - 3); j <= Math.min(149, k + 3); j++) { const w = 1 / (1 + Math.abs(j - k)); sum += raw[j] * w; weight += w; }
    return sum / weight;
  });
  const total = raw.reduce((a, b) => a + b, 0), area = valueArea(smooth, 0.7, total);
  if (!area.peak) { return paint.result("Profile needs non-zero volume."); }
  const val = low + area.lower * step, vah = low + (area.upper + 1) * step, poc = low + (area.poc + 0.5) * step;
  const maxDelta = Math.max(...delta.map(Math.abs)), curves: Anchor[][] = [[], []];
  const halfTotals = [smooth.slice(0, 75).reduce((a, b) => a + b / area.peak, 0), smooth.slice(75).reduce((a, b) => a + b / area.peak, 0)];
  const factor = 90 / Math.max(0.1, ...halfTotals);
  let voidStart = 0, voidEnd = 0, current = -1;
  for (let k = 0; k < 150; k++) {
    const top = low + (k + 1) * step, bottom = low + k * step, color = k >= 75 ? BEAR : BULL;
    const cumulative = (k >= 75 ? smooth.slice(75, k + 1) : smooth.slice(k, 75)).reduce((a, b) => a + b / area.peak, 0);
    const x = n + 100 - cumulative * factor;
    if (k % 2 === 0) { curves[Number(k >= 75)].push(anchor(x, bottom + step / 2)); }
    if (delta[k] && bottom >= val && top <= vah) { paint.box(anchor(n, top), anchor(x, bottom), "#00000000", transparent(delta[k] >= 0 ? BULL : BEAR, 100 - Math.abs(delta[k]) / (maxDelta || 1) * 42.5)); }
    const norm = smooth[k] / area.peak;
    if (norm > 0.01) { paint.box(anchor(n - window.length, top), anchor(n, bottom), "#00000000", transparent(color, 40 + 60 * (1 - norm ** 0.7))); }
    if (smooth[k] < area.peak * 0.15) { if (current < 0) { current = k; } if (k - current > voidEnd - voidStart) { voidStart = current; voidEnd = k; } } else { current = -1; }
  }
  curves.forEach((points, i) => paint.drawings.push({ id: `depth-${i}`, kind: "path", points, color: i ? BEAR : BULL, width: 2 }));
  for (const [price, text, color] of [[poc, "POC", "#ff9800"], [val, "VAL", BULL], [vah, "VAH", BEAR]] as const) { paint.segment(anchor(n - window.length, price), anchor(n + 100, price), color, "dotted"); paint.label(n + 100, price, text, color); }
  if (voidEnd > voidStart) { paint.box(anchor(n - window.length, low + (voidEnd + 1) * step), anchor(n, low + voidStart * step), "#787b86", "#787b8610", "Widest void"); }
  const means = smaValues(bars.map(b => b.volume), 200), sd = deviations(bars.map(b => b.volume), 200);
  for (let i = Math.max(199, bars.length - 300); i < bars.length; i++) {
    if (sd[i] > 0 && (bars[i].volume - means[i]) / sd[i] >= 2 && bars[i].volume / means[i] > 1.5) { paint.label(i, bars[i].close > bars[i].open ? bars[i].low : bars[i].high, "● RVOL", bars[i].close > bars[i].open ? BULL : BEAR, bars[i].close > bars[i].open); }
  }
  return { ...paint.result("300-bar close-price volume bins; polarity delta is an estimate. Depth curves are volume distributions, not order-book liquidity."), tables: [{ title: "Liquidity Structure", rows: [["Volume", total.toFixed(1)], ["Estimated delta", (buy - sell).toFixed(1)], ["POC", poc.toPrecision(7)], ["Value area", `${val.toPrecision(7)} – ${vah.toPrecision(7)}`]] as [string, string][] }] };
}

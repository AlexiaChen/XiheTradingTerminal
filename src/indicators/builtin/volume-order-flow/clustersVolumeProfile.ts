// Adapted from © LuxAlgo, Clusters Volume Profile. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/clusters_volume_profile.pinescript
import type { Candle } from "../../../marketData";
import { anchor, DrawingBuilder, transparent } from "../../pineSupport";
import { profileBins } from "../../volumeProfileMath";

export function clustersVolumeProfile(bars: Candle[]) {
  const paint = new DrawingBuilder(), window = bars.slice(-200).reverse(), n = bars.length - 1;
  if (window.length < 10) { return paint.result("At least 10 bars are required for clustering."); }
  const colors = ["#2196f3", "#f44336", "#4caf50", "#ff9800", "#9c27b0"];
  const prices = window.map(bar => (bar.high + bar.low) / 2), low = Math.min(...prices), high = Math.max(...prices);
  const centers = colors.map((_, k) => low + (high - low) * (k + 1) / 6), assigned = Array<number>(window.length).fill(0);
  for (let iteration = 0; iteration < 50; iteration++) {
    for (let i = 0; i < prices.length; i++) {
      let best = 0;
      for (let k = 1; k < centers.length; k++) { if (Math.abs(prices[i] - centers[k]) < Math.abs(prices[i] - centers[best])) { best = k; } }
      assigned[i] = best;
    }
    for (let k = 0; k < centers.length; k++) {
      let pv = 0, volume = 0;
      window.forEach((bar, i) => { if (assigned[i] === k) { pv += prices[i] * bar.volume; volume += bar.volume; } });
      if (volume > 0) { centers[k] = pv / volume; }
    }
  }
  for (let k = 0; k < centers.length; k++) {
    const members = window.filter((_, i) => assigned[i] === k);
    if (!members.length) { continue; }
    const bottom = Math.min(...members.map(bar => bar.low)), top = Math.max(...members.map(bar => bar.high));
    const { total, step } = profileBins(members, 20, bottom, top), max = Math.max(...total);
    if (!(max > 0 && step > 0)) { continue; }
    total.forEach((volume, row) => paint.box(anchor(n + 10, bottom + step * (row + 1)), anchor(n + 10 + 40 * volume / max, bottom + step * row), "#00000000", transparent(colors[k], 50)));
    window.forEach((bar, i) => { if (assigned[i] === k) { paint.label(n - i, (bar.high + bar.low) / 2, "•", colors[k]); } });
    paint.label(n + 10, centers[k], `C${k + 1} · ${members.reduce((sum, b) => sum + b.volume, 0).toFixed(1)}`, colors[k]);
  }
  return paint.result("Latest 200-bar snapshot: 5 volume-weighted K-means clusters, 50 iterations, 20 rows. Cluster assignments can change with the window.");
}

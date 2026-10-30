// Adapted from © LuxAlgo, Volume Profile with Node Detection. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/volume-order-flow/volume_profile_with_node_detection.pinescript
import type { Candle } from "../../../marketData";
import type { IndicatorContext } from "../../types";
import { anchor, DrawingBuilder, intervalSeconds, transparent } from "../../pineSupport";
import { intrabarGroups } from "../../intrabars";
import { profileBins, valueArea } from "../../volumeProfileMath";

export function volumeProfileNodes(bars: Candle[], interval: string, context?: IndicatorContext) {
  const paint = new DrawingBuilder(), seconds = intervalSeconds(interval), window = bars.slice(-360), n = bars.length - 1;
  const [tf, lowerSeconds] = seconds <= 900 ? ["1m", 60] : seconds <= 3600 ? ["5m", 300] : seconds <= 14400 ? ["15m", 900] : seconds <= 86400 ? ["1h", 3600] : ["1d", 86400];
  const lower = seconds === lowerSeconds ? window : context?.series.get(tf) ?? [];
  const groups = intrabarGroups(window, lower, seconds, lowerSeconds);
  if (window.length < 10 || groups.size !== window.length) { return paint.result(`Profile requires complete ${tf} coverage for its ${window.length} loaded chart bars; ${groups.size} covered. It is omitted rather than silently using chart candles.`); }
  const low = Math.min(...window.map(bar => bar.low)), high = Math.max(...window.map(bar => bar.high));
  const { total, buy, step } = profileBins([...groups.values()].flat(), 100, low, high), area = valueArea(total), max = area.peak;
  if (!(step > 0 && max > 0)) { return paint.result("Profile requires non-zero price range and volume."); }
  const width = Math.min(359, window.length - 1) * 0.31, right = n + Math.trunc(width + 13);
  for (let row = 0; row < 100; row++) {
    const upper = low + (row + 0.9) * step, bottom = low + (row + 0.1) * step, va = row >= area.lower && row <= area.upper, trans = 95 * (1 - total[row] / max);
    const split = right - Math.trunc(buy[row] / max * width), left = split - Math.trunc((total[row] - buy[row]) / max * width);
    paint.box(anchor(split, upper), anchor(right, bottom), "#00000000", transparent(va ? "#2962ff" : "#5d606b", trans));
    paint.box(anchor(left, upper), anchor(split, bottom), "#00000000", transparent(va ? "#fbc02d" : "#d1d4dc", trans));
    const isPeak = total[row] / max > 0.01 && total.every((value, other) => Math.abs(other - row) > 9 || other === row || value < total[row]);
    if (isPeak) {
      paint.box(anchor(n - window.length + 1, upper), anchor(left, bottom), "#00000000", transparent("#2196f3", 50));
      paint.label(left, (upper + bottom) / 2, "Volume node", "#2196f3");
    }
  }
  for (const [price, text, color] of [[high, "Profile high", "#787b86"], [low + (area.upper + 1) * step, "VAH", "#2962ff"], [low + (area.poc + 0.5) * step, "POC", "#fbc02d"], [low + area.lower * step, "VAL", "#2962ff"], [low, "Profile low", "#787b86"]] as const) { paint.label(right, price, `${text} ${price.toPrecision(6)}`, color); }
  return paint.result(`${window.length}-bar ${tf} profile, 100 rows, VA70%, 9-row peak neighborhood. OHLC-range volume allocation is an estimate; node highlights are aligned with the detected peak row.`);
}

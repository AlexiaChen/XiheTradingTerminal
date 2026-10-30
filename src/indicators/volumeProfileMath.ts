import type { Candle } from "../marketData";

/** Uniform high/low overlap allocation, matching the reference OHLCV profile convention. */
export function profileBins(bars: Candle[], rows: number, low: number, high: number, money = false) {
  const step = (high - low) / rows, total = Array<number>(rows).fill(0), buy = Array<number>(rows).fill(0);
  if (!(step > 0)) { return { total, buy, step }; }
  for (const bar of bars) {
    for (let k = 0; k < rows; k++) {
      const bottom = low + step * k, top = bottom + step;
      const fraction = bar.high > bar.low ? Math.max(0, Math.min(bar.high, top) - Math.max(bar.low, bottom)) / (bar.high - bar.low) : bar.close >= bottom && (bar.close < top || k === rows - 1 && bar.close === top) ? 1 : 0;
      const value = bar.volume * fraction * (money ? (top + bottom) / 2 : 1);
      total[k] += value; if (bar.close > bar.open) { buy[k] += value; }
    }
  }
  return { total, buy, step };
}

export function valueArea(values: number[], proportion = 0.7, targetTotal = values.reduce((a, b) => a + b, 0)) {
  const peak = Math.max(...values), poc = values.indexOf(peak);
  let lower = poc, upper = poc, sum = values[poc] ?? 0;
  while (sum < targetTotal * proportion && (upper < values.length - 1 || lower > 0)) {
    if (upper < values.length - 1 && (lower === 0 || values[upper + 1] >= values[lower - 1])) { sum += values[++upper]; }
    else { sum += values[--lower]; }
  }
  return { poc, lower, upper, peak };
}

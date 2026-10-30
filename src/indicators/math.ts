import type { Candle } from "../marketData";
import type { BuiltinPlot, BuiltinPoint } from "./types";

export function smaValues(values: number[], length: number): number[] {
  let sum = 0, count = 0;
  return values.map((value, i) => {
    if (Number.isFinite(value)) { sum += value; count++; }
    if (i >= length && Number.isFinite(values[i - length])) { sum -= values[i - length]; count--; }
    return count === length ? sum / length : NaN;
  });
}

/** EMA starts at the first finite sample; presets explicitly omit their warm-up. */
export function emaValues(values: number[], length: number): number[] {
  let previous = NaN;
  const alpha = 2 / (length + 1);
  return values.map(value => {
    if (!Number.isFinite(value)) { return NaN; }
    previous = Number.isFinite(previous) ? previous + alpha * (value - previous) : value;
    return previous;
  });
}

export function trueRanges(bars: Candle[]): number[] {
  return bars.map((bar, i) => i ? Math.max(bar.high - bar.low, Math.abs(bar.high - bars[i - 1].close), Math.abs(bar.low - bars[i - 1].close)) : bar.high - bar.low);
}

export function atrValues(bars: Candle[], length: number): number[] {
  let sum = 0, average = NaN;
  return trueRanges(bars).map((value, i) => {
    if (i < length) { sum += value; }
    if (i === length - 1) { average = sum / length; }
    else if (i >= length) { average = (average * (length - 1) + value) / length; }
    return average;
  });
}

export function extremes(bars: Candle[], length: number) {
  return bars.map((_, i) => i < length - 1 ? { high: NaN, low: NaN } : {
    high: Math.max(...bars.slice(i - length + 1, i + 1).map(bar => bar.high)),
    low: Math.min(...bars.slice(i - length + 1, i + 1).map(bar => bar.low))
  });
}

export function deviations(values: number[], length: number): number[] {
  const averages = smaValues(values, length);
  return values.map((_, i) => i < length - 1 ? NaN : Math.sqrt(values.slice(i - length + 1, i + 1).reduce((sum, value) => sum + (value - averages[i]) ** 2, 0) / length));
}

export function points(bars: Candle[], values: number[], warmup = 0): BuiltinPoint[] {
  return bars.flatMap((bar, i) => i >= warmup && Number.isFinite(values[i]) ? [{ time: bar.time, value: values[i] }] : []);
}

export function line(name: string, color: string, bars: Candle[], values: number[], warmup = 0): BuiltinPlot {
  return { name, color, type: "line", data: points(bars, values, warmup) };
}

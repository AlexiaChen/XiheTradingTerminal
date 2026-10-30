export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export const INTERVALS: Record<string, string> = { "1": "1m", "5": "5m", "15": "15m", "30": "30m", "60": "1h", "240": "4h", "360": "6h", "480": "8h", D: "1d", W: "1w" };

export function mergeCandles(existing: Candle[], incoming: Candle[], limit = 1000): Candle[] {
  const combined = new Map(existing.map(bar => [bar.time, bar]));
  for (const bar of incoming) { combined.set(bar.time, bar); }
  return [...combined.values()].sort((a, b) => a.time - b.time).slice(-limit);
}

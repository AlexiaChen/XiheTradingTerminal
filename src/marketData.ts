export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export const MARKET_DATA_ORIGIN = "https://data-api.binance.vision";
export const INTERVALS: Record<string, string> = { "1": "1m", "5": "5m", "15": "15m", "30": "30m", "60": "1h", "240": "4h", "360": "6h", "480": "8h", D: "1d", W: "1w" };

export function marketDataUrl(symbol: string, interval: string, limit = 1000): string {
  const match = /^BINANCE:([A-Z0-9]{4,30})$/.exec(symbol);
  if (!match) { throw new Error("Local charts support Binance spot symbols such as BINANCE:ETHUSDT. Use the Widget tab for other markets."); }
  const resolution = INTERVALS[interval];
  if (!resolution) { throw new Error(`Unsupported local interval: ${interval}`); }
  const url = new URL("/api/v3/klines", MARKET_DATA_ORIGIN);
  url.search = new URLSearchParams({ symbol: match[1], interval: resolution, limit: String(limit) }).toString();
  return url.toString();
}

export function parseKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) { throw new Error("Unexpected Binance candle response."); }
  const bars = raw.map((row): Candle => {
    if (!Array.isArray(row) || row.length < 6) { throw new Error("Invalid Binance candle."); }
    const [timestamp, open, high, low, close, volume] = row.slice(0, 6).map(Number);
    if (![timestamp, open, high, low, close, volume].every(Number.isFinite) || timestamp <= 0 || [open, high, low, close].some(value => value <= 0) || low > Math.min(open, close) || high < Math.max(open, close) || low > high || volume < 0) {
      throw new Error("Invalid Binance candle values.");
    }
    return { time: Math.floor(timestamp / 1000), open, high, low, close, volume };
  });
  if (bars.some((bar, index) => index > 0 && bar.time <= bars[index - 1].time)) { throw new Error("Binance candles must have ascending, unique timestamps."); }
  return bars;
}

export async function fetchCandles(symbol: string, interval: string, signal: AbortSignal, limit = 1000): Promise<Candle[]> {
  const response = await fetch(marketDataUrl(symbol, interval, limit), { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]) });
  if (!response.ok) { throw new Error(`Binance market data returned HTTP ${response.status}. Check the symbol, network and regional availability.`); }
  const bars = parseKlines(await response.json());
  if (!bars.length) { throw new Error("Binance returned no candles for this symbol."); }
  return bars;
}

export function mergeCandles(existing: Candle[], incoming: Candle[]): Candle[] {
  const combined = new Map(existing.map(bar => [bar.time, bar]));
  for (const bar of incoming) { combined.set(bar.time, bar); }
  return [...combined.values()].sort((a, b) => a.time - b.time).slice(-1000);
}

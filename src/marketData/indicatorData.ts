import { MARKET_DATA_ORIGIN, parseKlines, type Candle } from "../marketData";
import type { BuiltinIndicatorId } from "../indicators/catalog";
import type { IndicatorContext } from "../indicators/types";
import { intervalSeconds } from "../indicators/pineSupport";

const sourceSeconds: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400, "1w": 604800 };
export function indicatorDataRequirements(ids: BuiltinIndicatorId[], interval: string): string[] {
  const seconds = intervalSeconds(interval), needed = new Set<string>();
  if (ids.includes("nomada-levels") && seconds <= 14400 && 14400 % seconds === 0) { ["4h", "1d", "1w"].forEach(tf => needed.add(tf)); }
  if (ids.includes("htf-reversal") && seconds <= 900) { needed.add("15m"); }
  if (ids.includes("volume-delta") && seconds > 60) { needed.add("1m"); }
  if (ids.includes("volume-nodes") && seconds >= 60) { needed.add(seconds <= 900 ? "1m" : seconds <= 3600 ? "5m" : seconds <= 14400 ? "15m" : seconds <= 86400 ? "1h" : "1d"); }
  return [...needed];
}

/** Shared per chart, incremental auxiliary streams; explicit coverage rather than invented intrabars. */
export class IndicatorData {
  private readonly series = new Map<string, Candle[]>();

  async load(symbol: string, interval: string, ids: BuiltinIndicatorId[], bars: Candle[], signal: AbortSignal): Promise<IndicatorContext> {
    signal.throwIfAborted();
    if (!bars.length) { return { series: this.series }; }
    const ticker = /^BINANCE:([A-Z0-9]{4,30})$/.exec(symbol)?.[1];
    if (!ticker) { throw new Error("Indicator data supports Binance spot only."); }
    const until = bars.at(-1)!.time + intervalSeconds(interval);
    // Bounded history prevents high-timeframe delta selections downloading millions of intrabars.
    await Promise.all(indicatorDataRequirements(ids, interval).map(async resolution => {
      const seconds = sourceSeconds[resolution], existing = this.series.get(resolution) ?? [];
      let from = existing.length ? Math.max(existing[Math.max(0, existing.length - 2)].time, until - seconds * 12_000) : Math.max(bars[0].time - seconds * 2, until - seconds * 12_000);
      if (resolution === "4h" && !existing.length) { from = Math.min(from, until - seconds * 121); }
      if ((resolution === "1d" || resolution === "1w") && !existing.length) { from = Math.min(from, until - seconds * 3); }
      const merged = new Map(existing.map(bar => [bar.time, bar]));
      let pages = 0;
      while (from < until && pages++ < 14) {
        const url = new URL("/api/v3/klines", MARKET_DATA_ORIGIN);
        url.search = new URLSearchParams({ symbol: ticker, interval: resolution, startTime: String(from * 1000), endTime: String(until * 1000 - 1), limit: "1000" }).toString();
        const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]) });
        if (!response.ok) { throw new Error(`${resolution} indicator data returned HTTP ${response.status}.`); }
        const incoming = parseKlines(await response.json());
        for (const bar of incoming) { merged.set(bar.time, bar); }
        if (!incoming.length) { break; }
        const next = incoming.at(-1)!.time + seconds;
        if (next <= from) { break; }
        from = next;
        if (incoming.length < 1000) { break; }
      }
      signal.throwIfAborted();
      this.series.set(resolution, [...merged.values()].sort((a, b) => a.time - b.time).slice(-12_000));
    }));
    return { series: this.series };
  }

  clear() { this.series.clear(); }
}

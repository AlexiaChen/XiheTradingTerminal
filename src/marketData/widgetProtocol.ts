import type { Candle } from "../marketData";

export type WidgetMessage = { m: string; p: unknown[] };
export type WireCandle = Omit<Candle, "volume"> & { volume: number | null };
export type SymbolInfo = {
  requestedSymbol: string; symbol: string; interval: string; exchange: string; description: string;
  timezone: string; session: string; minTick: number; status: string; volumeAvailable: boolean;
};
export type FeedEvent =
  | { kind: "status"; state: "connecting" | "reconnecting" | "error"; message: string }
  | { kind: "series"; resolution: string; reset: boolean; bars: WireCandle[]; info: SymbolInfo };
export type FeedRequest = { id: string; symbol: string; interval: string; auxiliary: string[] };

export function widgetFrame(payload: string): string { return `~m~${payload.length}~m~${payload}`; }
export function widgetCommand(m: string, p: unknown[]): string { return widgetFrame(JSON.stringify({ m, p })); }

/** The feed may concatenate or split its application frames inside WebSocket messages. */
export class WidgetFrameDecoder {
  private pending = "";
  push(chunk: string): string[] {
    this.pending += chunk;
    if (this.pending.length > 4_000_000) { throw new Error("Widget response exceeds the frame limit."); }
    const result: string[] = [];
    while (this.pending.length) {
      if (this.pending.length < 3) { break; }
      if (!this.pending.startsWith("~m~")) { throw new Error("Unsupported Widget response framing."); }
      const end = this.pending.indexOf("~m~", 3);
      if (end < 0) { if (this.pending.length > 16) { throw new Error("Invalid Widget frame length."); } break; }
      const raw = this.pending.slice(3, end), length = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(length) || length > 4_000_000) { throw new Error("Invalid Widget frame length."); }
      if (this.pending.length < end + 3 + length) { break; }
      result.push(this.pending.slice(end + 3, end + 3 + length));
      this.pending = this.pending.slice(end + 3 + length);
    }
    return result;
  }
}

export function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function canonicalInterval(value: unknown): string | undefined {
  const raw = String(value ?? "");
  if (["D", "1D"].includes(raw)) { return "D"; }
  if (["W", "1W"].includes(raw)) { return "W"; }
  if (/^\d+$/.test(raw) && Number(raw) >= 1 && Number(raw) <= 1440) { return String(Number(raw)); }
  return undefined;
}
export const AUX_INTERVALS: Record<string, string> = { "1m": "1", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1d": "D", "1w": "W" };
export function validFeedRequest(raw: unknown): FeedRequest | undefined {
  const value = object(raw), interval = canonicalInterval(value.interval);
  if (typeof value.id !== "string" || !/^[\w-]{1,100}$/.test(value.id) || typeof value.symbol !== "string" || !/^[A-Z0-9_][A-Z0-9_.:!/^+\-]{0,99}$/.test(value.symbol) || !interval) { return undefined; }
  const auxiliary = Array.isArray(value.auxiliary) ? [...new Set(value.auxiliary.filter((tf): tf is string => typeof tf === "string" && Object.hasOwn(AUX_INTERVALS, tf)))] : [];
  return { id: value.id, symbol: value.symbol, interval, auxiliary };
}

/** Missing volume stays missing across JSON IPC; it is never manufactured from price changes. */
export function parseWidgetCandle(raw: unknown): WireCandle {
  if (!Array.isArray(raw) || raw.length < 5 || !raw.slice(0, 5).every(v => typeof v === "number" && Number.isFinite(v))) { throw new Error("Invalid Widget OHLC values."); }
  const [time, open, high, low, close] = raw as number[];
  if (time <= 0 || !Number.isInteger(time) || low > Math.min(open, close) || high < Math.max(open, close) || low > high) { throw new Error("Invalid Widget candle bounds."); }
  const volume = typeof raw[5] === "number" && Number.isFinite(raw[5]) && raw[5] >= 0 ? raw[5] : null;
  return { time, open, high, low, close, volume };
}

/** Indexed storage also replaces revised historical bars rather than retaining their old timestamps. */
export class WidgetSeries {
  private readonly values = new Map<number, WireCandle>();
  revision = false;
  constructor(private readonly limit = 12_000) {}
  update(raw: unknown): WireCandle[] {
    if (!Array.isArray(raw)) { return []; }
    const incoming = raw.map(row => {
      const record = object(row);
      if (typeof record.i !== "number" || !Number.isInteger(record.i)) { throw new Error("Invalid Widget bar index."); }
      return { index: record.i, bar: parseWidgetCandle(record.v) };
    });
    this.revision = false;
    for (const { index, bar } of incoming) {
      if (this.values.has(index) && this.values.get(index)!.time !== bar.time) { this.revision = true; }
      this.values.set(index, bar);
    }
    if (this.values.size > this.limit) {
      const indices = [...this.values.keys()].sort((a, b) => a - b);
      for (const index of indices.slice(0, -this.limit)) { this.values.delete(index); }
    }
    return incoming.map(row => row.bar);
  }
  snapshot(): WireCandle[] {
    return [...new Map([...this.values.values()].map(bar => [bar.time, bar])).values()].sort((a, b) => a.time - b.time);
  }
}

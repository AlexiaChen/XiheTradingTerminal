import type { Candle } from "../../marketData";
import type { BuiltinResult, BuiltinPoint } from "../types";
import { INDICATOR_COLORS as C } from "../palette";

export function sessionVwap(bars: Candle[], interval: string): BuiltinResult {
  if (["D", "W"].includes(interval)) { return { plots: [], notice: "Session VWAP requires an intraday interval." }; }
  let session = -1, volume = 0, weighted = 0;
  const data: BuiltinPoint[] = [];
  const firstSession = bars.length ? Math.floor(bars[0].time / 86400) : -1;
  const completeFirst = bars.length > 0 && bars[0].time % 86400 === 0;
  for (const bar of bars) {
    const day = Math.floor(bar.time / 86400);
    if (day !== session) { session = day; volume = 0; weighted = 0; }
    volume += bar.volume;
    weighted += (bar.high + bar.low + bar.close) / 3 * bar.volume;
    // A truncated first day must not masquerade as a complete session VWAP.
    if (volume > 0 && (session !== firstSession || completeFirst)) { data.push({ time: bar.time, value: weighted / volume }); }
  }
  return { plots: [{ name: "VWAP UTC day", color: C.purple, type: "line", data }], ...(!completeFirst && bars.length ? { notice: "VWAP omits the incomplete first UTC day in the loaded history." } : {}) };
}

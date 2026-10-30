import type { Candle } from "../marketData";
import { bucket } from "./pineSupport";

/** Return complete historical parent groups and a contiguous forming group; never fill gaps with zeros. */
export function intrabarGroups(bars: Candle[], lower: Candle[], parentSeconds: number, childSeconds: number) {
  const groups = new Map<number, Candle[]>(), valid = new Map<number, Candle[]>();
  for (const bar of lower) { const key = bucket(bar.time, parentSeconds); const group = groups.get(key) ?? []; group.push(bar); groups.set(key, group); }
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], group = groups.get(bar.time);
    if (!group?.length || group[0].time !== bar.time || group.some((point, j) => point.time !== bar.time + j * childSeconds)) { continue; }
    if (i < bars.length - 1 && group.length !== parentSeconds / childSeconds) { continue; }
    valid.set(bar.time, group);
  }
  return valid;
}

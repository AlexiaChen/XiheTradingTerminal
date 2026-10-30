import type { Candle } from "../marketData";

/** Return complete historical parent groups and a contiguous forming group; never fill gaps with zeros. */
export function intrabarGroups(bars: Candle[], lower: Candle[], parentSeconds: number, childSeconds: number) {
  const valid = new Map<number, Candle[]>();
  let cursor = 0;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i], end = Math.min(bar.time + parentSeconds, bars[i + 1]?.time ?? Infinity);
    while (cursor < lower.length && lower[cursor].time < bar.time) { cursor++; }
    const group: Candle[] = [];
    for (let j = cursor; j < lower.length && lower[j].time < end; j++) { group.push(lower[j]); }
    // Anchor to the actual parent open, including e.g. US 09:30 hourly bars.
    // Short sessions and gaps stay uncovered unless a complete group is present.
    if (!group.length || group[0].time !== bar.time || group.some((point, j) => point.time !== bar.time + j * childSeconds || !Number.isFinite(point.volume))) { continue; }
    if (i < bars.length - 1 && group.length !== parentSeconds / childSeconds) { continue; }
    valid.set(bar.time, group);
  }
  return valid;
}

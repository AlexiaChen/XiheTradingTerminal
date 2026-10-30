import type { BuiltinIndicatorId } from "../indicators/catalog";
import { intervalSeconds } from "../indicators/pineSupport";

export function indicatorDataRequirements(ids: BuiltinIndicatorId[], interval: string): string[] {
  const seconds = intervalSeconds(interval), needed = new Set<string>();
  if (ids.includes("nomada-levels") && seconds <= 14400 && 14400 % seconds === 0) { ["4h", "1d", "1w"].forEach(tf => needed.add(tf)); }
  if (ids.includes("htf-reversal") && seconds <= 900) { needed.add("15m"); }
  if (ids.includes("volume-delta") && seconds > 60) { needed.add("1m"); }
  if (ids.includes("volume-nodes") && seconds >= 60) { needed.add(seconds <= 900 ? "1m" : seconds <= 3600 ? "5m" : seconds <= 14400 ? "15m" : seconds <= 86400 ? "1h" : "1d"); }
  return [...needed];
}

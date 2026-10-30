// Algorithm adaptation of the supplied Trendlines [LunqFX] reference.
// The reference has no local license declaration; attribution is retained, no MIT claim is made.
// Source: third-party/tradingview-indicator/trend/trendlines_breakouts_touches_hold_rate.pinescript
import type { Candle } from "../../../marketData";
import type { IndicatorContext } from "../../types";
import { atrValues } from "../../math";
import { anchor, DrawingBuilder, pivotAt, transparent, type Pivot } from "../../pineSupport";

type Trendline = { side: number; price: number; start: number; slope: number; touches: number; lastTouch: number; end?: number };
type Event = Trendline & { kind: "touch" | "break"; bar: number; retested: boolean; judged: boolean };
const at = (line: Trendline, index: number) => line.price + line.slope * (index - line.start);

export function trendlinesHoldRate(input: Candle[], _interval: string, context?: IndicatorContext) {
  // The source explicitly decides all events on confirmed bars.
  const bars = input.slice(0, -1), paint = new DrawingBuilder(), atr = atrValues(bars, 14);
  const pivots = new Map<number, Pivot[]>([[1, []], [-1, []]]), live: Trendline[] = [], dead: Trendline[] = [], events: Event[] = [];
  let held = 0, touchFailed = 0, followed = 0, breakFailed = 0, retested = 0, breaks = 0;
  const color = (side: number) => side === 1 ? context?.theme === "light" ? "#A21CAF" : "#D946EF" : context?.theme === "light" ? "#0284C7" : "#38BDF8";
  for (let i = 13; i < bars.length; i++) {
    const bar = bars[i], tolerance = atr[i] * 0.25;
    for (const side of [1, -1]) {
      const pivot = pivotAt(bars, i, 8, 8, side === 1);
      if (!pivot) { continue; }
      const history = pivots.get(side)!;
      let best: Trendline | undefined;
      for (let k = history.length - 1; k >= Math.max(0, history.length - 6); k--) {
        const first = history[k];
        if (!(side === 1 ? pivot.price < first.price : pivot.price > first.price) || pivot.index - first.index < 10 || i - first.index >= 480) { continue; }
        const line: Trendline = { side, price: first.price, start: first.index, slope: (pivot.price - first.price) / (pivot.index - first.index), touches: 2, lastTouch: i };
        if (bars.slice(first.index + 1, i + 1).some((candle, j) => side === 1 ? candle.close > at(line, first.index + 1 + j) + tolerance : candle.close < at(line, first.index + 1 + j) - tolerance)) { continue; }
        line.touches += history.filter(p => p.index > first.index && p.index < pivot.index && Math.abs(p.price - at(line, p.index)) <= tolerance).length;
        if (!best || line.touches > best.touches) { best = line; }
      }
      if (best && best.touches >= 3 && !live.some(line => {
        if (line.side !== side) { return false; }
        const gap = Math.abs(at(line, i) - at(best!, i)), similar = Math.abs(line.slope - best!.slope) <= Math.max(Math.abs(line.slope), Math.abs(best!.slope)) * 0.35;
        return gap <= tolerance || similar && gap <= 0.75 * atr[i] || line.start === best!.start && line.touches >= best!.touches;
      })) {
        live.push(best);
        if (live.filter(line => line.side === side).length > 3) { live.splice(live.findIndex(line => line.side === side), 1); }
      }
      history.push(pivot); if (history.length > 30) { history.shift(); }
    }
    for (let k = live.length - 1; k >= 0; k--) {
      const line = live[k], price = at(line, i), broken = line.side === 1 ? bar.close > price + 0.1 * atr[i] : bar.close < price - 0.1 * atr[i];
      if (broken) {
        breaks++; events.push({ ...line, kind: "break", bar: i, retested: false, judged: false });
        paint.label(i, line.side === 1 ? bar.low : bar.high, line.side === 1 ? "▲ BREAK" : "▼ BREAK", color(line.side), line.side === 1);
        line.end = i; dead.push(line); if (dead.length > 2) { dead.shift(); } live.splice(k, 1);
      } else if ((line.side === 1 ? bar.high >= price - tolerance : bar.low <= price + tolerance) && i - line.lastTouch > 8) {
        line.touches++; line.lastTouch = i; events.push({ ...line, kind: "touch", bar: i, retested: false, judged: false });
        paint.label(i, price, "Touch", color(line.side), line.side === -1);
      }
    }
    for (let k = events.length - 1; k >= 0; k--) {
      const event = events[k], price = at(event, i), age = i - event.bar;
      const back = event.side === 1 ? bar.close < price - 0.1 * atr[i] : bar.close > price + 0.1 * atr[i];
      if (event.kind === "touch") {
        const through = event.side === 1 ? bar.close > price + 0.1 * atr[i] : bar.close < price - 0.1 * atr[i];
        const away = event.side === 1 ? price - bar.low >= atr[i] : bar.high - price >= atr[i];
        if (through) { touchFailed++; } else if (away) { held++; }
        if (through || away || age > 20) { events.splice(k, 1); }
      } else {
        const beyond = event.side === 1 ? bar.high - price >= atr[i] : price - bar.low >= atr[i];
        if (!event.judged) { if (back) { breakFailed++; event.judged = true; } else if (beyond && age > 0) { followed++; event.judged = true; } }
        const near = event.side === 1 ? bar.low <= price + tolerance : bar.high >= price - tolerance;
        if (age > 1 && near && !back && !event.retested) { event.retested = true; retested++; paint.label(i, event.side === 1 ? bar.low : bar.high, "RETEST", color(event.side), event.side === 1); }
        if (back || age > 20) { if (!event.judged) { breakFailed++; } events.splice(k, 1); }
      }
    }
  }
  [...dead, ...live].forEach(line => {
    const end = line.end ?? input.length + 14;
    if (line.end === undefined) { paint.segment(anchor(line.start, line.price), anchor(end, at(line, end)), transparent(color(line.side), 82), undefined, 7); }
    paint.segment(anchor(line.start, line.price), anchor(end, at(line, end)), color(line.side), line.end === undefined ? undefined : "dashed", 2);
    if (line.end === undefined) { paint.label(end, at(line, end), `${line.touches} touches`, color(line.side)); }
  });
  const rate = (wins: number, all: number) => all ? `${(100 * wins / all).toFixed(0)}% (${wins}/${all})` : "— (0 samples)";
  return { ...paint.result("Closed bars only; touch/break resolution uses 1 ATR within 20 bars. Neon candle overrides are omitted for Gruvbox."), tables: [{ title: "Trendline observations", rows: [["Touch hold rate", rate(held, held + touchFailed)], ["Break follow-through", rate(followed, followed + breakFailed)], ["Retested breaks", rate(retested, breaks)], ["Pending events", String(events.length)]] as [string, string][] }] };
}

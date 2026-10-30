// Adapted from © LuxAlgo, Universal Signal Backtester. CC BY-NC-SA 4.0.
// Source: third-party/tradingview-indicator/signal-evaluation/universal_signal_backtester.pinescript
import type { Candle } from "../../../marketData";
import { atrValues, emaValues } from "../../math";
import { anchor, BEAR, BULL, DrawingBuilder } from "../../pineSupport";

export function universalSignalBacktester(input: Candle[]) {
  const bars = input.slice(0, -1), paint = new DrawingBuilder(), fast = emaValues(bars.map(b => b.close), 9), slow = emaValues(bars.map(b => b.close), 21), atr = atrValues(bars, 14);
  type Position = { direction: number; entry: number; index: number; end: number; targets: number[]; stops: number[]; hits: boolean[]; remaining: number; pnl: number };
  const positions: Position[] = [];
  let position: Position | undefined, pnl = 0, peak = 0, drawdown = 0, wins = 0, losses = 0, trades = 0, grossWin = 0, grossLoss = 0;
  const hits = [0, 0, 0];
  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i], signal = fast[i] > slow[i] && fast[i - 1] <= slow[i - 1] ? 1 : fast[i] < slow[i] && fast[i - 1] >= slow[i - 1] ? -1 : 0;
    if (position) {
      position.end = i;
      let closed = false;
      // Preserve the source's conservative SL-before-TP ordering on an ambiguous OHLC bar.
      const stop = position.stops.find(price => position!.direction === 1 ? bar.low <= price : bar.high >= price);
      if (stop !== undefined) { position.pnl += (stop - position.entry) * position.direction * position.remaining; position.remaining = 0; closed = true; }
      if (!closed) {
        for (let k = 0; k < 3; k++) {
          const price = position.targets[k];
          if (!position.hits[k] && (position.direction === 1 ? bar.high >= price : bar.low <= price)) {
            position.hits[k] = true; hits[k]++; position.pnl += (price - position.entry) * position.direction / 3; position.remaining -= 1 / 3;
          }
        }
        closed = position.remaining <= 0.001;
      }
      if (!closed && signal === -position.direction) { position.pnl += (bar.close - position.entry) * position.direction * position.remaining; position.remaining = 0; closed = true; }
      if (closed) {
        trades++; pnl += position.pnl;
        if (position.pnl > 0) { wins++; grossWin += position.pnl; } else if (position.pnl < 0) { losses++; grossLoss -= position.pnl; }
        peak = Math.max(peak, pnl); drawdown = Math.max(drawdown, peak - pnl);
        paint.label(i, position.direction === 1 ? bar.high : bar.low, `${position.pnl >= 0 ? "✓" : "✗"} ${position.pnl.toFixed(2)}`, position.pnl >= 0 ? BULL : BEAR, position.direction < 0);
        position = undefined;
      }
    }
    // Original enters on the signal close, after evaluating the previous position's exit.
    if (!position && signal && Number.isFinite(atr[i]) && atr[i] > 0) {
      position = { direction: signal, entry: bar.close, index: i, end: i, targets: [1, 2, 3].map(k => bar.close + signal * atr[i] * k), stops: [1.5, 2.5, 3.5].map(k => bar.close - signal * atr[i] * k), hits: [false, false, false], remaining: 1, pnl: 0 };
      positions.push(position); paint.label(i, signal === 1 ? bar.low : bar.high, signal === 1 ? "▲ EMA LONG" : "▼ EMA SHORT", signal === 1 ? BULL : BEAR, signal === 1);
    }
  }
  for (const trade of positions.slice(-12)) {
    trade.targets.forEach((price, k) => { paint.segment(anchor(trade.index, price), anchor(trade.end, price), BULL, "dotted"); if (trade === position) { paint.label(trade.end + 2, price, `TP${k + 1}${trade.hits[k] ? " ✓" : ""}`, BULL); } });
    trade.stops.forEach((price, k) => { paint.segment(anchor(trade.index, price), anchor(trade.end, price), BEAR, "dotted"); if (trade === position) { paint.label(trade.end + 2, price, `SL${k + 1}`, BEAR); } });
  }
  return { ...paint.result("Default EMA9/21 simulation, closed bars, 1/3 TP exits at ATR14 ×1/2/3; first hit SL at ×1.5/2.5/3.5 wins over TP on the same bar. No fees (source default). P&L is per one unit in quote-price units, not Pine ticks. External TV source streams and live orders are unavailable."), tables: [{ title: "EMA signal simulation", rows: [["Closed trades", String(trades)], ["Wins / losses / flat", `${wins} / ${losses} / ${trades - wins - losses}`], ["Realized P&L (price units)", pnl.toFixed(4)], ["Max realized drawdown", drawdown.toFixed(4)], ["Profit factor", grossLoss ? (grossWin / grossLoss).toFixed(2) : "—"], ["TP1 / TP2 / TP3 hits", hits.join(" / ")], ["Unclosed position", position ? position.direction === 1 ? "Long (excluded from totals)" : "Short (excluded from totals)" : "None"]] as [string, string][] }] };
}

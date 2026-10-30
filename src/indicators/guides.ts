import { BUILTIN_INDICATORS, type BuiltinIndicatorId } from "./catalog";
import { PINE_INDICATORS } from "./pineCatalog";

export type IndicatorGuide = { summary: string; usage: string; signals: string; limitations: string; author: string };
const basics: Partial<Record<BuiltinIndicatorId, [string, string, string]>> = {
  "auto-fib": ["Measures retracement within the latest confirmed ZigZag swing.", "Read the grid from swing end 0% back to swing start 100%; observe how price reacts at intermediate ratios.", "It measures a pullback, not a direction forecast. Anchors can move when the latest swing changes; out-of-range readings remain visible."],
  "ema-ribbon": ["EMA20/50/200 track three trend horizons.", "Compare line order and slope; price crossing a single line alone does not establish a new trend.", "EMAs lag and depend on the loaded history seed."],
  bollinger: ["SMA20 with population-standard-deviation bands ×2.", "Compare band width for volatility and price location for relative extremes.", "A band touch does not imply a reversal; current-bar bands can change."],
  donchian: ["Rolling 20-bar high/low channel and midpoint.", "Compare price with the prior channel boundary when observing breakouts.", "The displayed channel includes the current bar; do not treat its updated boundary as a prior-known breakout trigger."],
  keltner: ["EMA20 with Wilder ATR10 bands ×2.", "Read channel slope and width alongside price structure.", "ATR reflects past range; the channel is not a forecast interval."],
  supertrend: ["ATR10 ×3 trailing trend bands.", "Watch close crossing the active trailing band and the resulting band direction.", "Current-bar flips can disappear before close; stop-like lines are not orders."],
  vwap: ["Volume-weighted HLC3 reset at UTC midnight.", "Compare intraday price with the session volume-weighted mean.", "Incomplete first loaded sessions are omitted; daily/weekly charts are unsupported."],
  volume: ["Candle volume in the units supplied by the actual market source.", "Compare activity with nearby candles and price movement.", "Candle direction colors do not identify the actual aggressor side of trades."],
  rsi: ["Wilder RSI14 measures relative gains and losses.", "Read momentum around 50 and extreme regions in the context of the prevailing trend.", "Overbought/oversold readings are not automatic sell/buy signals."],
  macd: ["EMA12−EMA26, with EMA9 signal and difference histogram.", "Compare line crossovers with the sign and change of the histogram.", "Momentum can weaken before price reverses; signals lag and may whipsaw."],
  stochastic: ["Smoothed close location in the last 14-bar range (%K/%D 3/3).", "Compare K/D turns with the current range or trend.", "Values can remain extreme during a strong trend."],
  atr: ["Wilder ATR14 measures true-range volatility including gaps.", "Use it to compare recent range and normalize other observations.", "ATR has price units and provides no directional signal."],
  squeeze: ["BB/KC compression with regression momentum.", "Purple baseline dots mark compression; read subsequent expansion together with histogram momentum.", "Compression gives no guaranteed breakout direction or timing."]
};

export function indicatorGuide(id: BuiltinIndicatorId): IndicatorGuide {
  const source = PINE_INDICATORS.find(item => item.id === id);
  if (source) { return source.guide; }
  const item = BUILTIN_INDICATORS.find(item => item.id === id)!;
  const guide = basics[id];
  return { summary: guide?.[0] ?? item.parameters, usage: guide?.[1] ?? "Compare with price and the current market structure.", limitations: guide?.[2] ?? "Historical calculations are not forecasts.", signals: item.parameters, author: "Xihe built-in preset" };
}

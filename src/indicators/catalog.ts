/** Optional local presets. Required MA90/ZigZag remain separate and cannot be unchecked. */
export const BUILTIN_INDICATORS = [
  { id: "auto-fib", name: "Auto Fib Retracement", parameters: "Latest ZigZag 5%, 10 swing · 0–100% retracement", pane: false },
  { id: "ema-ribbon", name: "EMA Ribbon", parameters: "20 / 50 / 200 · close", pane: false },
  { id: "bollinger", name: "Bollinger Bands", parameters: "SMA 20 · population σ × 2", pane: false },
  { id: "donchian", name: "Donchian Channels", parameters: "20 bars · high / low", pane: false },
  { id: "keltner", name: "Keltner Channels", parameters: "EMA 20 · Wilder ATR 10 × 2", pane: false },
  { id: "supertrend", name: "Supertrend", parameters: "Wilder ATR 10 × 3", pane: false },
  { id: "vwap", name: "Session VWAP", parameters: "HLC3 · UTC day · intraday only", pane: false },
  { id: "volume", name: "Volume", parameters: "Base-asset volume", pane: true },
  { id: "rsi", name: "RSI", parameters: "Wilder 14", pane: true },
  { id: "macd", name: "MACD", parameters: "EMA 12 / 26 · signal EMA 9", pane: true },
  { id: "stochastic", name: "Stochastic", parameters: "14 / 3 / 3", pane: true },
  { id: "atr", name: "ATR", parameters: "Wilder 14", pane: true },
  { id: "squeeze", name: "Squeeze Momentum", parameters: "20 · BB 2 · KC 1.5 · linear regression", pane: true }
] as const;
export type BuiltinIndicatorId = typeof BUILTIN_INDICATORS[number]["id"];

export function normalizeLocalIndicators(raw: unknown, legacyStudies: unknown = []): BuiltinIndicatorId[] {
  const values = new Set(Array.isArray(raw) ? raw : Array.isArray(legacyStudies) ? [
    ...(legacyStudies.includes("Volume@tv-basicstudies") ? ["volume"] : []),
    ...(legacyStudies.includes("RSI@tv-basicstudies") ? ["rsi"] : [])
  ] : []);
  return BUILTIN_INDICATORS.filter(item => values.has(item.id)).map(item => item.id);
}

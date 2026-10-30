import { PINE_INDICATORS } from "./pineCatalog";

/** Optional local presets. Required MA90/ZigZag remain separate and cannot be unchecked. */
export const INDICATOR_CATEGORIES = [
  { id: "trend", name: "Trend & channels", aliases: "趋势 均线 通道" },
  { id: "momentum", name: "Momentum & volatility", aliases: "动量 震荡 波动" },
  { id: "support-resistance", name: "Support & resistance", aliases: "支撑 阻力 回撤 斐波那契" },
  { id: "market-structure", name: "Structure & liquidity", aliases: "结构 流动性 扫单" },
  { id: "fvg-ict", name: "FVG & ICT", aliases: "公允 缺口 订单块 聪明钱" },
  { id: "volume-order-flow", name: "Volume & order flow", aliases: "成交量 订单流 分布" },
  { id: "timeframes-sessions", name: "Timeframes & sessions", aliases: "多周期 时段 时区" },
  { id: "signal-evaluation", name: "Signal evaluation", aliases: "信号 评估 回测" }
] as const;
export type IndicatorCategory = typeof INDICATOR_CATEGORIES[number]["id"];

export const BUILTIN_INDICATORS = [
  { id: "auto-fib", category: "support-resistance", name: "Auto Fib Retracement", parameters: "Latest ZigZag 5%, 10 swing · 0–100% retracement", pane: false },
  { id: "ema-ribbon", category: "trend", name: "EMA Ribbon", parameters: "20 / 50 / 200 · close", pane: false },
  { id: "bollinger", category: "trend", name: "Bollinger Bands", parameters: "SMA 20 · population σ × 2", pane: false },
  { id: "donchian", category: "trend", name: "Donchian Channels", parameters: "20 bars · high / low", pane: false },
  { id: "keltner", category: "trend", name: "Keltner Channels", parameters: "EMA 20 · Wilder ATR 10 × 2", pane: false },
  { id: "supertrend", category: "trend", name: "Supertrend", parameters: "Wilder ATR 10 × 3", pane: false },
  { id: "vwap", category: "volume-order-flow", name: "Session VWAP", parameters: "HLC3 · UTC day · intraday only", pane: false },
  { id: "volume", category: "volume-order-flow", name: "Volume", parameters: "Source volume units", pane: true },
  { id: "rsi", category: "momentum", name: "RSI", parameters: "Wilder 14", pane: true },
  { id: "macd", category: "momentum", name: "MACD", parameters: "EMA 12 / 26 · signal EMA 9", pane: true },
  { id: "stochastic", category: "momentum", name: "Stochastic", parameters: "14 / 3 / 3", pane: true },
  { id: "atr", category: "momentum", name: "ATR", parameters: "Wilder 14", pane: true },
  { id: "squeeze", category: "momentum", name: "Squeeze Momentum", parameters: "20 · BB 2 · KC 1.5 · linear regression", pane: true },
  ...PINE_INDICATORS
] as const;
export type BuiltinIndicatorId = typeof BUILTIN_INDICATORS[number]["id"];

export function normalizeLocalIndicators(raw: unknown, legacyStudies: unknown = []): BuiltinIndicatorId[] {
  const values = new Set(Array.isArray(raw) ? raw : Array.isArray(legacyStudies) ? [
    ...(legacyStudies.includes("Volume@tv-basicstudies") ? ["volume"] : []),
    ...(legacyStudies.includes("RSI@tv-basicstudies") ? ["rsi"] : [])
  ] : []);
  return BUILTIN_INDICATORS.filter(item => values.has(item.id)).map(item => item.id);
}

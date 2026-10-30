import type { Candle } from "../../marketData";
import type { BuiltinIndicatorId } from "../catalog";
import type { BuiltinResult } from "../types";
import { autoFibRetracement } from "./autoFibRetracement";
import { supertrend } from "./supertrend";
import { sessionVwap } from "./sessionVwap";
import { squeezeMomentum } from "./squeezeMomentum";
import { emaRibbon } from "./emaRibbon";
import { bollingerBands } from "./bollingerBands";
import { donchianChannels } from "./donchianChannels";
import { keltnerChannels } from "./keltnerChannels";
import { volume } from "./volume";
import { rsiPreset } from "./rsi";
import { macd } from "./macd";
import { stochastic } from "./stochastic";
import { atr } from "./atr";

type Calculation = (bars: Candle[], interval: string) => BuiltinResult;
const calculations: Record<BuiltinIndicatorId, Calculation> = {
  "auto-fib": autoFibRetracement,
  "supertrend": (bars) => supertrend(bars),
  "vwap": sessionVwap,
  "squeeze": squeezeMomentum,
  "ema-ribbon": emaRibbon,
  "bollinger": bollingerBands,
  "donchian": donchianChannels,
  "keltner": keltnerChannels,
  "volume": volume,
  "rsi": rsiPreset,
  "macd": macd,
  "stochastic": stochastic,
  "atr": atr,
};

export function calculateBuiltin(id: BuiltinIndicatorId, bars: Candle[], interval: string): BuiltinResult {
  return calculations[id](bars, interval);
}

import { nomadaLevels } from "./support-resistance/nomadaLevels";
import { trendlinesHoldRate } from "./trend/trendlinesHoldRate";
import { smartMoneyConcepts } from "./fvg-ict/smartMoneyConcepts";
import { swingBreakoutSequence } from "./market-structure/swingBreakoutSequence";
import { trendlineNavigator } from "./trend/trendlineNavigator";
import { volumeDeltaCandles } from "./volume-order-flow/volumeDeltaCandles";
import { volumeProfileNodes } from "./volume-order-flow/volumeProfileNodes";
import { htfReversalDivergences } from "./timeframes-sessions/htfReversalDivergences";
import { liquidityDeltaProfiler } from "./volume-order-flow/liquidityDeltaProfiler";
import { marketStructureObScore } from "./market-structure/marketStructureObScore";
import { universalSignalBacktester } from "./signal-evaluation/universalSignalBacktester";
import { ictUnicorn } from "./fvg-ict/ictUnicorn";
import { purePriceActionIct } from "./fvg-ict/purePriceActionIct";
import { ictKillzones } from "./timeframes-sessions/ictKillzones";
import { supportResistanceMtf } from "./support-resistance/supportResistanceMtf";
import { evasiveSupertrend } from "./trend/evasiveSupertrend";
import { supportResistanceBreaks } from "./support-resistance/supportResistanceBreaks";
import { purePriceActionStructures } from "./market-structure/purePriceActionStructures";
import { liquiditySweeps } from "./market-structure/liquiditySweeps";
import { purePriceActionLiquiditySweeps } from "./market-structure/purePriceActionLiquiditySweeps";
import { breakoutsTestsRetests } from "./support-resistance/breakoutsTestsRetests";
import { institutionalOrderFlow } from "./volume-order-flow/institutionalOrderFlow";
import { clustersVolumeProfile } from "./volume-order-flow/clustersVolumeProfile";
import { deltaFlowProfile } from "./volume-order-flow/deltaFlowProfile";
import { liquidityStructureOrderFlow } from "./volume-order-flow/liquidityStructureOrderFlow";
import { fvgInstantaneousMitigation } from "./fvg-ict/fvgInstantaneousMitigation";
import { htfPo3 } from "./timeframes-sessions/htfPo3";
import { volumetricOrderFlowStructure } from "./volume-order-flow/volumetricOrderFlowStructure";
import { supportResistancePro } from "./support-resistance/supportResistancePro";
import { pivotMissedReversals } from "./support-resistance/pivotMissedReversals";
import type { Candle } from "../../marketData";
import type { BuiltinIndicatorId } from "../catalog";
import type { BuiltinResult, IndicatorContext } from "../types";
import { autoFibRetracement } from "./support-resistance/autoFibRetracement";
import { supertrend } from "./trend/supertrend";
import { sessionVwap } from "./volume-order-flow/sessionVwap";
import { squeezeMomentum } from "./momentum/squeezeMomentum";
import { emaRibbon } from "./trend/emaRibbon";
import { bollingerBands } from "./trend/bollingerBands";
import { donchianChannels } from "./trend/donchianChannels";
import { keltnerChannels } from "./trend/keltnerChannels";
import { volume } from "./volume-order-flow/volume";
import { rsiPreset } from "./momentum/rsi";
import { macd } from "./momentum/macd";
import { stochastic } from "./momentum/stochastic";
import { atr } from "./momentum/atr";

export type Calculation = (bars: Candle[], interval: string, context?: IndicatorContext) => BuiltinResult;
const calculations: Record<BuiltinIndicatorId, Calculation> = {
  "evasive-supertrend": evasiveSupertrend,
  "sr-breaks": supportResistanceBreaks,
  "pa-structures": purePriceActionStructures,
  "liquidity-sweeps": liquiditySweeps,
  "pa-liquidity-sweeps": purePriceActionLiquiditySweeps,
  "breakout-retest": breakoutsTestsRetests,
  "institutional-flow": institutionalOrderFlow,
  "clusters-vp": clustersVolumeProfile,
  "delta-flow": deltaFlowProfile,
  "liquidity-depth": liquidityStructureOrderFlow,
  "imfvg": fvgInstantaneousMitigation,
  "htf-po3": htfPo3,
  "volumetric-structure": volumetricOrderFlowStructure,
  "sr-pro": supportResistancePro,
  "pivot-missed": pivotMissedReversals,
  "nomada-levels": nomadaLevels,
  "trendline-hold-rate": trendlinesHoldRate,
  "smc": smartMoneyConcepts,
  "swing-sequence": swingBreakoutSequence,
  "trendline-navigator": trendlineNavigator,
  "volume-delta": volumeDeltaCandles,
  "volume-nodes": volumeProfileNodes,
  "htf-reversal": htfReversalDivergences,
  "liquidity-delta": liquidityDeltaProfiler,
  "msb-ob-score": marketStructureObScore,
  "signal-backtester": universalSignalBacktester,
  "ict-unicorn": ictUnicorn,
  "pa-ict": purePriceActionIct,
  "ict-killzones": ictKillzones,
  "sr-mtf": supportResistanceMtf,
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

export function calculateBuiltin(id: BuiltinIndicatorId, bars: Candle[], interval: string, context?: IndicatorContext): BuiltinResult {
  return calculations[id](bars, interval, context);
}

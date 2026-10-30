# Built-in local indicator reference

Version 0.0.4 adds 13 optional JavaScript presets to Lightweight Charts. MA90 and ZigZag remain mandatory. The following formulas are implemented independently in this project; the linked TradingView definitions and community work informed the selection and algorithms. No Pine source is embedded or executed.

## Retracement within one ZigZag swing

**Auto Fib Retracement** uses the latest two pivots from the existing ZigZag (5% reversal, depth 10), calculated without the forming candle. Let the swing start at price A and end at price B. A retracement ratio r has price `B - (B - A) * r`. Current pullback depth is `(B - currentClose) / (B - A) * 100` percent. This works for either ordering of the two price anchors; it is a measurement, not a forecast of direction.

The grid contains 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6% and 100%. It spans the latest selected swing and extends to the current bar. There are no extension levels or entry/exit signals. Outside-range readings remain visible rather than being clamped. Fewer than two confirmed pivots produces an explanatory message and no levels.

This is a retrospective overlay for the **latest** confirmed swing. As new pivots are confirmed or a later extreme replaces the latest pivot, the anchors and entire grid can move; it is not a historical trading-signal series. The forming price affects the current percentage, not the anchor calculation. The local fixed-percentage ZigZag is not a claim of matching TradingView's ATR-based Auto Fib anchor selection. Reference: [TradingView Auto Fib Retracement](https://www.tradingview.com/support/solutions/43000585089-auto-fib-retracement/).

## Overlay presets

| Preset | Formula and initialization | Reference |
| --- | --- | --- |
| EMA Ribbon 20/50/200 | Close-price EMA, alpha `2/(n+1)`, seeded at the first loaded close. Each line omits its first n−1 observations. | [TradingView EMA](https://www.tradingview.com/support/solutions/43000592270-exponential-moving-average/) |
| Bollinger Bands 20,2 | SMA20 of close ± twice the population standard deviation of the same 20 closes; first output after 20 bars. | [TradingView BB](https://www.tradingview.com/support/solutions/43000501840-bollinger-bands-bb/) |
| Donchian Channels 20 | Highest high and lowest low of the last 20 bars, including the current bar, plus their midpoint. | [TradingView Donchian](https://www.tradingview.com/support/solutions/43000502253-donchian-channels-dc/) |
| Keltner Channels 20/10/2 | Close EMA20 ± 2 × Wilder ATR10. Lines begin after 20 bars. | [TradingView Keltner](https://www.tradingview.com/support/solutions/43000502266-keltner-channels-kc/) |
| Supertrend 10,3 | HL2 bands ± 3 × Wilder ATR10, trailing bands with prior-close resets; direction changes only when close crosses the relevant band. The initial state uses the upper band. | [TradingView Supertrend](https://www.tradingview.com/support/solutions/43000634738-supertrend/) |
| Session VWAP | Sum of HLC3 × volume divided by volume, reset at 00:00 UTC. Skip zero cumulative volume. Omit an incomplete first loaded day; daily/weekly charts show a notice. | [TradingView VWAP](https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/) |

True range includes gaps: max of high−low, absolute high−previousClose and absolute low−previousClose. Wilder ATR starts with the mean of n true ranges, then uses alpha `1/n`; the first bar uses its high−low range.

## Separate panes

| Preset | Formula and initialization | Reference |
| --- | --- | --- |
| Volume | Base-asset volume, mist-blue when close ≥ open and wheat-gold otherwise. | Binance candle volume |
| RSI 14 | Existing Wilder gain/loss averages; flat prices yield 50, loss-free rises 100 and gain-free falls 0. | [TradingView RSI](https://www.tradingview.com/support/solutions/43000502338-relative-strength-index-rsi/) |
| MACD 12/26/9 | EMA12(close) − EMA26(close), EMA9 of that difference, and their histogram. Price EMAs and signal start at their first observation; MACD displays from bar 26, signal/histogram from bar 34. | [TradingView MACD](https://www.tradingview.com/support/solutions/43000502344-moving-average-convergence-divergence-macd/) |
| Stochastic 14/3/3 | Raw %K from rolling high/low and close; SMA3 gives the plotted %K, another SMA3 gives %D. A zero-width price range yields 50. First %K at bar 16, %D at bar 18. | [TradingView Stochastic](https://www.tradingview.com/support/solutions/43000502332-stochastic-stoch/) |
| ATR 14 | Wilder-smoothed true range as above, first output at bar 14. | [TradingView ATR](https://www.tradingview.com/support/solutions/43000501823-average-true-range-atr/) |
| Squeeze Momentum | See below. | [LazyBear's public Squeeze Momentum description](https://www.tradingview.com/script/nqQ1DT5a-Squeeze-Momentum-Indicator-LazyBear/) |

The Squeeze preset uses SMA20(close) ± 2 population deviations for Bollinger Bands and SMA20(close) ± 1.5 × SMA20(true range) for its Keltner envelope. This convention is specific to Squeeze; the standalone Keltner preset uses EMA/ATR. Compression means BB is inside KC. Purple baseline dots mark compression, aqua marks expansion, gray equality/neutral.

Momentum is the endpoint of a 20-value linear regression on `close - average(midpoint(highestHigh20, lowestLow20), SMA20(close))`. It first appears at bar 39. Histogram colors distinguish sign and increasing/decreasing momentum. The concept follows the public community description by LazyBear, itself discussing John Carter's squeeze framework. This is an independent, explicitly parameterized implementation, not a bundled copy of that Pine script or its alerts.

## Calculation and storage boundaries

- Calculations use at most the latest 1,000 loaded Binance spot bars. EMA seeds, Wilder warm-up and chart-history length can produce differences from a website with more history.
- Non-Fibonacci presets use current and previous bars only; regression tests check that appending future candles leaves past values unchanged. Values on the forming candle can change.
- Optional presets start off, except migrated local Volume/RSI selections. Each chart saves its own list; copied charts get an independent list. An explicit empty list stays empty.
- Widget study IDs remain separate from local selections. Checking a local preset does not modify or rebuild the cached Widget. Changing local chart configuration may rebuild the local instance.
- Preset parameters are fixed and displayed in the picker for this release. The existing local JS-file interface remains available for custom formulas and parameters.
- Each indicator has its own TS module under `src/indicators/builtin/`; `catalog.ts` contains metadata, `math.ts` common numerical primitives, and `builtin/index.ts` only registration.

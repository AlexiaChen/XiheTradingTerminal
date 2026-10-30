# Built-in Indicator Showcase

XiheTradingTerminal 1.0.0 pairs a hosted TradingView main chart with a local indicator preview. This gallery shows all 30 source-derived presets individually, plus the 13 traditional optional presets. Multi-selection remains available in the product; the source-derived screenshots select **one optional preset per image**. Mandatory MA90 and ZigZag (5%, 10) remain visible.

Screenshots come from the current built Webview and real extension-host feed code with a VS Code API preview shim, real hosted charts and real streamed ETHUSDT candles. They do not demonstrate a running VS Code extension host, complete Pine compatibility, or numerical parity. A preset may have no matching event in the displayed window. Some signals and anchors are retrospective, and source history/coverage is bounded.

Use **Built-in Indicators** to search and select a preset; hover/focus/click its applied chip for the guide. Formulas, defaults, author notes, reductions and licensing are in the [30-preset guide](pine-indicators.md) and [traditional indicator guide](indicators.md). OHLCV-derived volume profiles/delta are estimates, not actual order flow or prediction probabilities.

[Back to README](../README.md)

## Source-derived presets

### Trend and trendlines

#### Evasive SuperTrend

ETHUSDT / 4H · LuxAlgo · only `evasive-supertrend` selected.

![Evasive SuperTrend displayed alone on the local preview](assets/showcase/evasive-supertrend.png)

Bands retreat from nearby price to reduce noise-driven trend flips.

#### Trendline Breakout Navigator

ETHUSDT / 4H · LuxAlgo · only `trendline-navigator` selected.

![Trendline Breakout Navigator displayed alone on the local preview](assets/showcase/trendline-navigator.png)

Tracks multiple swing horizons and adapts trendlines after new higher/lower pivots.

#### Trendlines · Breakouts, Touches & Hold Rate

ETHUSDT / 4H · LunqFX · only `trendline-hold-rate` selected.

![Trendlines · Breakouts, Touches & Hold Rate displayed alone on the local preview](assets/showcase/trendline-hold-rate.png)

Fits lines through confirmed swings and counts touches, breaks and retests.

### Support, resistance and retracement

#### Support & Resistance Levels with Breaks

ETHUSDT / 4H · LuxAlgo · only `sr-breaks` selected.

![Support & Resistance Levels with Breaks displayed alone on the local preview](assets/showcase/sr-breaks.png)

Pivot support/resistance rails with volume-qualified breaks and wick labels.

#### Support & Resistance Signals MTF

ETHUSDT / 4H · LuxAlgo · only `sr-mtf` selected.

![Support & Resistance Signals MTF displayed alone on the local preview](assets/showcase/sr-mtf.png)

Tracks support/resistance zones, false breaks, tests, retests and manipulation zones.

#### Support Resistance Pro Toolkit

ETHUSDT / 4H · LuxAlgo · only `sr-pro` selected.

![Support Resistance Pro Toolkit displayed alone on the local preview](assets/showcase/sr-pro.png)

Detects zones and monitors their touch bars, sweeps, volume and lifetime.

#### Pivot Points · Missed Reversals

ETHUSDT / 4H · LuxAlgo · only `pivot-missed` selected.

![Pivot Points · Missed Reversals displayed alone on the local preview](assets/showcase/pivot-missed.png)

Adds missed extremes between regular pivots and connects them with a ZigZag.

#### SellSide BuySide · NomadaScalper

ETHUSDT / 1H · NomadaScalper · only `nomada-levels` selected.

![SellSide BuySide · NomadaScalper displayed alone on the local preview](assets/showcase/nomada-levels.png)

Maps completed H4 high/low levels and previous daily/weekly extremes.

#### Swing Breakouts · Tests & Retests

ETHUSDT / 4H · LuxAlgo · only `breakout-retest` selected.

![Swing Breakouts · Tests & Retests displayed alone on the local preview](assets/showcase/breakout-retest.png)

Follows swing zones through their original and broken/retested states.

### Market structure and liquidity

#### Liquidity Sweeps

ETHUSDT / 4H · LuxAlgo · only `liquidity-sweeps` selected.

![Liquidity Sweeps displayed alone on the local preview](assets/showcase/liquidity-sweeps.png)

Detects a wick through a confirmed liquidity level followed by a close back inside.

#### Pure Price Action Liquidity Sweeps

ETHUSDT / 4H · LuxAlgo · only `pa-liquidity-sweeps` selected.

![Pure Price Action Liquidity Sweeps displayed alone on the local preview](assets/showcase/pa-liquidity-sweeps.png)

Finds liquidity sweeps using nested short/intermediate/long price patterns.

#### Pure Price Action Structures

ETHUSDT / 4H · LuxAlgo · only `pa-structures` selected.

![Pure Price Action Structures displayed alone on the local preview](assets/showcase/pa-structures.png)

Builds three nested price-pattern hierarchies and marks structural closes.

#### Swing Breakout Sequence

ETHUSDT / 4H · LuxAlgo · only `swing-sequence` selected.

![Swing Breakout Sequence displayed alone on the local preview](assets/showcase/swing-sequence.png)

Detects ordered swing breakout patterns with internal points and optional double top/bottom context.

#### Market Structure Break · OB Toolkit

ETHUSDT / 4H · LuxAlgo · only `msb-ob-score` selected.

![Market Structure Break · OB Toolkit displayed alone on the local preview](assets/showcase/msb-ob-score.png)

Filters structure breaks with momentum and scores associated order blocks.

### FVG and ICT

#### FVG Instantaneous Mitigation

ETHUSDT / 4H · LuxAlgo · only `imfvg` selected.

![FVG Instantaneous Mitigation displayed alone on the local preview](assets/showcase/imfvg.png)

Finds gaps mitigated immediately on the next bar, with sentiment opposite to the original gap.

#### ICT Unicorn Model

ETHUSDT / 4H · LuxAlgo · only `ict-unicorn` selected.

![ICT Unicorn Model displayed alone on the local preview](assets/showcase/ict-unicorn.png)

Combines a breaker block and overlapping fair-value gap in a four-swing structure.

#### Pure Price Action ICT Tools

ETHUSDT / 4H · LuxAlgo · only `pa-ict` selected.

![Pure Price Action ICT Tools displayed alone on the local preview](assets/showcase/pa-ict.png)

Combines hierarchical price-action structures with liquidity, order/breaker blocks and voids.

#### Smart Money Concepts

ETHUSDT / 4H · LuxAlgo · only `smc` selected.

![Smart Money Concepts displayed alone on the local preview](assets/showcase/smc.png)

Marks internal/swing BOS and CHoCH, order blocks, equal highs/lows and premium/discount areas.

### Volume and order-flow estimates

#### Clusters Volume Profile

ETHUSDT / 4H · LuxAlgo · only `clusters-vp` selected.

![Clusters Volume Profile displayed alone on the local preview](assets/showcase/clusters-vp.png)

Groups candle midpoints into volume-weighted K-means clusters and builds a profile per cluster.

#### Delta Flow Profile

ETHUSDT / 4H · LuxAlgo · only `delta-flow` selected.

![Delta Flow Profile displayed alone on the local preview](assets/showcase/delta-flow.png)

Shows money flow and estimated polarity delta at price, with a developing POC.

#### Institutional Order Flow Strength

ETHUSDT / 4H · LuxAlgo · only `institutional-flow` selected.

![Institutional Order Flow Strength displayed alone on the local preview](assets/showcase/institutional-flow.png)

Ranks unmitigated structure-break order blocks by displacement and relative volume.

#### Liquidity Delta Profiler

ETHUSDT / 4H · LuxAlgo · only `liquidity-delta` selected.

![Liquidity Delta Profiler displayed alone on the local preview](assets/showcase/liquidity-delta.png)

Divides pivot liquidity zones into quadrants and tracks estimated delta consumption and reactions.

#### Liquidity Structure & Order Flow

ETHUSDT / 4H · LuxAlgo · only `liquidity-depth` selected.

![Liquidity Structure & Order Flow displayed alone on the local preview](assets/showcase/liquidity-depth.png)

Combines a close-price volume heatmap, delta backdrop, depth curves, value area and unusual-volume bubbles.

#### Volume Delta Candles

ETHUSDT / 5m · LuxAlgo · only `volume-delta` selected.

![Volume Delta Candles displayed alone on the local preview](assets/showcase/volume-delta.png)

Shows lower-timeframe up/down volume as a colored fraction of each chart candle.

#### Volume Profile · Node Detection

ETHUSDT / 5m · LuxAlgo · only `volume-nodes` selected.

![Volume Profile · Node Detection displayed alone on the local preview](assets/showcase/volume-nodes.png)

Detects high/low-volume nodes within a lower-timeframe volume profile.

#### Volumetric Order Flow Structure

ETHUSDT / 4H · LuxAlgo · only `volumetric-structure` selected.

![Volumetric Order Flow Structure displayed alone on the local preview](assets/showcase/volumetric-structure.png)

Draws structure breaks with synthetic order-block profiles and manipulation marks.

### Higher timeframes and sessions

#### HTF Reversal & Divergences

ETHUSDT / 5m · LuxAlgo · only `htf-reversal` selected.

![HTF Reversal & Divergences displayed alone on the local preview](assets/showcase/htf-reversal.png)

Combines higher-timeframe engulfing/pin-bar patterns with RSI pivot divergence and a forming HTF projection.

#### HTF PO3

ETHUSDT / 5m · LuxAlgo · only `htf-po3` selected.

![HTF PO3 displayed alone on the local preview](assets/showcase/htf-po3.png)

Projects the forming 1H candle and maps its open/high/low back to their chart-bar origins.

#### ICT Killzones Toolkit

ETHUSDT / 5m · LuxAlgo · only `ict-killzones` selected.

![ICT Killzones Toolkit displayed alone on the local preview](assets/showcase/ict-killzones.png)

Highlights Asian/London/New York killzones and structures, blocks and gaps formed around them.

### Signal evaluation

#### Universal Signal Backtester

ETHUSDT / 4H · LuxAlgo · only `signal-backtester` selected.

![Universal Signal Backtester displayed alone on the local preview](assets/showcase/signal-backtester.png)

Evaluates hypothetical signals with target/stop rules and a results dashboard.

## Traditional presets

Traditional indicators may be combined in these examples. Each source-derived preset above remains isolated.

### Channels and moving averages

EMA Ribbon, Bollinger Bands, Donchian Channels, Keltner Channels and Supertrend.

![Traditional channels and moving averages](assets/showcase/trend-classic.png)

### Momentum

RSI, MACD and Stochastic in separate panes.

![Traditional momentum panes](assets/showcase/momentum.png)

### Volatility

ATR and Squeeze Momentum.

![Traditional volatility panes](assets/showcase/volatility.png)

### Fibonacci retracement

One optional Auto Fib Retracement preset. The latest confirmed ZigZag swing uses end=0%, start=100%; an out-of-range current reading is shown honestly.

![Auto Fib Retracement](assets/showcase/auto-fib.png)

### Volume and UTC VWAP

Source volume and the UTC-day Session VWAP. This is not an exchange-session VWAP.

![Traditional volume and UTC VWAP](assets/showcase/traditional-volume.png)

## Picker and guides

Search and category changes preserve selection and chart instances. Changing the selected preset rebuilds only the preview; the main iframe stays open.

![Single-preset picker example](assets/builtin-indicators.png)

![Applied-chip guide for a single source-derived preset](assets/indicator-guide.png)

The 28 LuxAlgo adaptations retain CC BY-NC-SA 4.0. Two supplied references have no local license declaration. Author labels here are attribution, not a license grant. The bundled [adaptation notice](../third-party/indicator-adaptations-NOTICE.txt) and per-preset guide remain authoritative.

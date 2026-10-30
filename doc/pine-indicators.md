# Source-derived indicator presets

Xihe includes 30 TypeScript presets adapted from the supplied Pine references,
in addition to the 13 original optional presets. Each has its own algorithm file,
organized by category. No Pine interpreter, transpiler, or fork of Lightweight Charts is used in the indicator calculations. The 1.0 preview data transport separately uses an undocumented Widget feed protocol. These are fixed, source-derived presets;
they do **not** reproduce every input, alert, dashboard cell, or interaction of
the original TradingView scripts, and numerical/visual parity with TradingView
has not been established.

Use **Built-in Indicators**, choose a category, and check several indicators.
Category changes and English/Chinese search preserve all checked selections,
including hidden matches. Applied chips show the entire selection across
categories. Hover, focus, or click a chip to read its guide; use its × to remove
that indicator. MA90 and ZigZag remain mandatory. Source-derived markers, boxes,
rails and fills are rendered directly on the native chart. They are available
on the simultaneous Lightweight indicator preview. See the [classified screenshot showcase](built-in-indicator-showcase.md).

The descriptions below combine the local source calculations with the authors'
usage notes included at the end of the reference files. Colors follow explicit
source hex values and Pine transparency (80% transparency means 20% opacity).
Gruvbox remains the base candle/UI theme; source `barcolor`/neon candle overrides
are not applied globally. Volume Delta intentionally adds a translucent delta
body overlay. Dashboards use the terminal's colors and compact disclosure panels.

## Shared boundaries

- Preview: requests 1,000 candles from the hosted Widget service, displays UTC, and receives streamed updates. The server may return fewer bars. History seeds and confirmation can differ from a longer chart history. The actual resolved source and delay are visible.
- Forming candles are provisional. Trendline Hold Rate, Swing Breakout Sequence,
  and the signal simulation evaluate closed bars. Origin pivots/boxes may be
  drawn retrospectively after confirmation; they were not known at the origin.
- Auxiliary Widget streams are subscribed only for selected presets, using the same resolved market as the main stream. Each retains at most 12,000 candles; server history can be shorter.
  Missing intrabars are never manufactured. Volume Delta shows covered bars only;
  Volume Profile Nodes requires its full selected window and otherwise explains
  why it is omitted. Groups are anchored to actual parent opens, but short sessions remain uncovered without complete intrabars. Missing volume is unavailable (NaN in user JS), not zero. Volume-dependent presets skip it. Fixed-UTC HTF PO3, S/R MTF and Nomada Levels are omitted for non-24x7 sessions; exchange-session alignment has not been implemented.
- OHLCV delta/profile formulas in these sources are estimates. They do not prove
  institutional activity, aggressor buy/sell flow, or order-book liquidity.
- Each preset retains at most 1,500 latest drawing objects, with an explicit note
  if capped. Horizontal profiles and projections reserve space to the right.
- Original optional inputs remain at the documented preset settings. Community
  Pine scripts, tick-mode reconstruction, external TradingView `input.source`
  streams, TradingView alerts, second-based premium inputs, and live execution
  are unavailable. Loading local JS files continues to use the existing Worker
  line/histogram contract; this rich built-in renderer does not grant scripts DOM
  or chart access.
- This port uses source-derived algorithms and selected default visual layers,
  not screenshot matching as proof of algorithm parity. Any specific functional
  narrowing or changed timing below is part of the preset contract.

## Trend and trendlines

### Evasive SuperTrend

**Preset:** ATR10 × 3 · noise 1 ATR · expansion 0.5 ATR. **Author:** LuxAlgo.

Bands retreat from nearby price to reduce noise-driven trend flips. Follow solid trend bands; dotted sections show noise expansion. BULL/BEAR labels mark a band crossing.

**Marks and colors:** Green #089981 / red #f23645; gradient fill between price midpoint and band.

**Limits:** A forming candle can change the signal; the band can move away from price, unlike ordinary Supertrend.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/trend/evasive_supertrend.pinescript).

### Trendline Breakout Navigator

**Preset:** Long / medium / short 60 / 30 / 10. **Author:** LuxAlgo.

Tracks multiple swing horizons and adapts trendlines after new higher/lower pivots. Compare the active trendline with close and wick-break dots; use the selected long horizon for the main state.

**Marks and colors:** Green/red lines; blue/orange wick dots.

**Limits:** Pivots require confirmation; historical line anchors are retrospective. The preset uses the chart timeframe.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/trend/trendline_breakout_navigator.pinescript).

### Trendlines · Breakouts, Touches & Hold Rate

**Preset:** Swing 8 · tolerance 0.25 ATR · 20-bar evaluation. **Author:** LunqFX.

Fits lines through confirmed swings and counts touches, breaks and retests. Watch confirmed closes beyond a line, then a retest; inspect resolved and pending sample counts in the dashboard.

**Marks and colors:** Blue support and magenta resistance; labels distinguish touches, breaks and retests.

**Limits:** Observed hold rates depend on this loaded sample and ATR target/window; they are not forecasts.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/trend/trendlines_breakouts_touches_hold_rate.pinescript).

## Support and resistance

### Support & Resistance Levels with Breaks

**Preset:** Pivots 15 / 15 · volume oscillator >20. **Author:** LuxAlgo.

Pivot support/resistance rails with volume-qualified breaks and wick labels. B marks a close crossing with sufficient volume. Bull/Bear Wick marks the script’s candle-shape condition.

**Marks and colors:** Red resistance #FF0000; blue support #233dee; green/red signal labels.

**Limits:** Rails are offset back 16 bars after confirmation. A displayed origin is not the time the level became known.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/support_and_resistance_levels_with_breaks.pinescript).

### Support & Resistance Signals MTF

**Preset:** Chart timeframe · pivot 15 · zone margin 2. **Author:** LuxAlgo.

Tracks support/resistance zones, false breaks, tests, retests and manipulation zones. Distinguish a zone rejection from a close through it; tests and retests refer to different zone states.

**Marks and colors:** Green support, red resistance, blue/orange manipulation zones.

**Limits:** The source scales pivot lookback by a timeframe ratio; it does not request independently aggregated HTF candles.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/support_and_resistance_signals_MTF.pinescript).

### Support Resistance Pro Toolkit

**Preset:** Donchian 10 · ATR200 × 0.5 · max 5 active. **Author:** LuxAlgo.

Detects zones and monitors their touch bars, sweeps, volume and lifetime. Use unbroken zones as areas of interest; ✖ marks a close through the boundary. Compare entries, sweeps and duration.

**Marks and colors:** Green support #089981 and red resistance #f23645.

**Limits:** This preset uses the original default Donchian method. Touching-bar counts are not independent trades or predictive strength.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/support_resistance_pro_toolkit.pinescript).

### Pivot Points · Missed Reversals

**Preset:** Pivot length 50 · regular and ghost pivots. **Author:** LuxAlgo.

Adds missed extremes between regular pivots and connects them with a ZigZag. Triangles mark regular pivots; ghosts mark missed reversals. Ghost rails can be used as contextual support/resistance.

**Marks and colors:** Red highs #ef5350; green lows #26a69a; missed links are dashed.

**Limits:** Confirmed pivots arrive 50 bars after their origin. The latest ghost can move until the next pivot confirms.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/pivot_points_high_low_missed_reversal_levels.pinescript).

### SellSide BuySide · NomadaScalper

**Preset:** Completed 4H extremes · previous day/week. **Author:** NomadaScalper.

Maps completed H4 high/low levels and previous daily/weekly extremes. Solid rails begin when a completed source candle becomes available and stop at first contact; dotted segments show origin context.

**Marks and colors:** Teal highs/lows and rose counterpart levels; blue/yellow daily, gold weekly references.

**Limits:** Requires H4 or a lower interval dividing H4. This is a level map, not an entry system or probability model.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/sellside_buyside_nomada_scalper.pinescript).

### Swing Breakouts · Tests & Retests

**Preset:** Pivots 10 / 1 · ATR200 width · 500 bars. **Author:** LuxAlgo.

Follows swing zones through their original and broken/retested states. ▲/▼ identify tests; hollow △/▽ identify retests after a zone changes state.

**Marks and colors:** Green/red translucent zones retain the original #08998145 / #f2364545 palette.

**Limits:** The right edge can move back to the last retest after timeout; a historical zone is not a live entry instruction.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/support-resistance/breakouts_with_tests_retests.pinescript).

## Market structure and liquidity

### Liquidity Sweeps

**Preset:** Swings 5 · Only Wicks · extend 300 bars. **Author:** LuxAlgo.

Detects a wick through a confirmed liquidity level followed by a close back inside. Watch the highlighted wick-to-level zone and short opposite-wick dotted rail for subsequent reactions.

**Marks and colors:** Green bullish/red bearish; dotted swept level and translucent sweep area.

**Limits:** The preset follows original Only Wicks defaults; it does not enable the optional breakout-and-retest detection mode.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/market-structure/liquidity_sweeps.pinescript).

### Pure Price Action Liquidity Sweeps

**Preset:** Long-term three-level swing hierarchy. **Author:** LuxAlgo.

Finds liquidity sweeps using nested short/intermediate/long price patterns. A wick outside a long-term swing followed by an inside close creates a small sweep area.

**Marks and colors:** Green bullish #08998180 and red bearish #f2364580 sweep boxes.

**Limits:** Long-term pivots need later confirming patterns; their historical origin was not actionable in advance.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/market-structure/pure_price_action_liquidity_sweeps.pinescript).

### Pure Price Action Structures

**Preset:** Short / intermediate / long-term structures. **Author:** LuxAlgo.

Builds three nested price-pattern hierarchies and marks structural closes. BOS continues the current structural direction; MSS changes it. Compare the three line styles for scale.

**Marks and colors:** Dotted ST, dashed IT and solid LT; green bullish/red bearish; long-term pivot circles.

**Limits:** Nested pivots are confirmed later than their origin. BOS/MSS labels describe structural state, not guaranteed continuation.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/market-structure/pure_price_action_structures.pinescript).

### Swing Breakout Sequence

**Preset:** Swing 5 · internal 2 · default pattern filters. **Author:** LuxAlgo.

Detects ordered swing breakout patterns with internal points and optional double top/bottom context. Read the numbered sequence in order and distinguish the pattern’s bounds from later price action.

**Marks and colors:** Original green/red paths, translucent boxes and numbered points.

**Limits:** Pattern anchors are retrospective confirmed swings; a detected pattern does not predict its outcome.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/market-structure/swing_breakout_sequence.pinescript).

### Market Structure Break · OB Toolkit

**Preset:** Momentum Z-score · volume percentile · OB zones. **Author:** LuxAlgo.

Filters structure breaks with momentum and scores associated order blocks. Watch MSB labels and shaded OBs; a higher percentage reflects the formula’s momentum/volume score.

**Marks and colors:** Green/red MSB and OBs; brighter high-score zones.

**Limits:** The percentage is a quality score, not a calibrated win probability; mitigation rate is sample-specific.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/market-structure/market_structure_break_OB_probability_toolkit.pinescript).

## FVG and ICT

### FVG Instantaneous Mitigation

**Preset:** Width filter 0 · ATR200 trailing ×3. **Author:** LuxAlgo.

Finds gaps mitigated immediately on the next bar, with sentiment opposite to the original gap. Arrows mark mitigation; the dashed average extends until crossed in the opposite direction. The trailing line follows the active bias.

**Marks and colors:** Teal bullish, red bearish; gap fills retain 50% transparency.

**Limits:** Optional source TP/SL areas default off. Source candle recoloring is omitted to preserve the shared Gruvbox candles.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/fvg-ict/FVG_instantaneous_mitigation_signals.pinescript).

### ICT Unicorn Model

**Preset:** Swings 10 · risk/reward 1:1. **Author:** LuxAlgo.

Combines a breaker block and overlapping fair-value gap in a four-swing structure. Wait for the structure and FVG overlap, then watch its trigger, invalidation swing and target area.

**Marks and colors:** Green/red FVG; gray risk and blue reward areas.

**Limits:** A projection/target box is conditional geometry, not an order. Pivot confirmation and current-bar changes matter.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/fvg-ict/ICT_unicorn_model.pinescript).

### Pure Price Action ICT Tools

**Preset:** Nested swings · structures · blocks · liquidity voids. **Author:** LuxAlgo.

Combines hierarchical price-action structures with liquidity, order/breaker blocks and voids. Use the individual labeled layers together; a liquidity void is an area of imbalance rather than an automatic reversal signal.

**Marks and colors:** Original green/red structures and translucent gray void/order-block styling.

**Limits:** Several retrospective layers share the loaded history; recent-window modes and confirmation affect what remains visible.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/fvg-ict/pure_price_action_ICT_tools.pinescript).

### Smart Money Concepts

**Preset:** Internal 5 · swing 50 · default SMC layers. **Author:** LuxAlgo.

Marks internal/swing BOS and CHoCH, order blocks, equal highs/lows and premium/discount areas. Compare internal and swing structure, then inspect the unmitigated OBs and nearby equal highs/lows.

**Marks and colors:** Original green/red structure and blue/red order-block palette.

**Limits:** Default FVG/HTF overlays are off. Community Pine is not executed; source bar recoloring is omitted for Gruvbox consistency.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/fvg-ict/smart_money_concepts.pinescript).

## Volume and order flow

### Clusters Volume Profile

**Preset:** 200 bars · 5 clusters · 50 iterations · 20 rows. **Author:** LuxAlgo.

Groups candle midpoints into volume-weighted K-means clusters and builds a profile per cluster. Match colored price dots with the same cluster’s horizontal volume rows; compare concentration rather than direction.

**Marks and colors:** Original blue/red/green/orange/purple cluster palette.

**Limits:** Clusters can reassign when the latest window changes. Price-bin volume is distributed from candles, not measured individual trades.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/clusters_volume_profile.pinescript).

### Delta Flow Profile

**Preset:** 360 bars · 25 rows · polarity · money flow. **Author:** LuxAlgo.

Shows money flow and estimated polarity delta at price, with a developing POC. Compare row widths and blue/red dominance, then inspect the POC path for the highest-flow region.

**Marks and colors:** Blue #5288C4, red #f7525f and red POC #f23645.

**Limits:** Money flow multiplies distributed volume by bin price. Candle polarity estimates buying/selling and is not actual aggressor classification.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/delta_flow_profile.pinescript).

### Institutional Order Flow Strength

**Preset:** Pivot 5 · 5 OBs · strongest buffer 5. **Author:** LuxAlgo.

Ranks unmitigated structure-break order blocks by displacement and relative volume. Compare percentage scores and the highlighted strongest zone; a broken zone is removed from consideration.

**Marks and colors:** Original green/red zones and strongest-zone fill.

**Limits:** The name does not imply institutional order data: the score uses OHLCV. It is not a win probability.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/institutional_order_flow_strength_classifier.pinescript).

### Liquidity Delta Profiler

**Preset:** Liquidity zones · 4 quadrants · decay / reaction stats. **Author:** LuxAlgo.

Divides pivot liquidity zones into quadrants and tracks estimated delta consumption and reactions. Watch zone consumption and sweeps; use the reaction dashboard to see resolved/pending observations.

**Marks and colors:** Original green/red quadrant gradients; teal/yellow reaction emphasis.

**Limits:** Delta is volume × (close-open)/(high-low), allocated by overlap. Zone capacity and reaction rates are model assumptions.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/liquidity_delta_profiler.pinescript).

### Liquidity Structure & Order Flow

**Preset:** 300 bars · 150 bins · smoothing 3 · VA70%. **Author:** LuxAlgo.

Combines a close-price volume heatmap, delta backdrop, depth curves, value area and unusual-volume bubbles. Read POC/VAH/VAL, widest low-volume void and high-RVOL bubbles alongside the distribution curves.

**Marks and colors:** Green lower depth, red upper depth, orange POC; original intensity/transparency gradients.

**Limits:** Depth curves are inferred volume distributions, not live order-book depth. Polarity delta and repainting latest-window bins are explicit estimates.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/liquidity_structure_order_flow.pinescript).

### Volume Delta Candles

**Preset:** Lower-timeframe polarity · no historical tick emulation. **Author:** LuxAlgo.

Shows lower-timeframe up/down volume as a colored fraction of each chart candle. Compare the delta-colored body fraction with total candle range; positive and negative delta can disagree with the chart candle direction.

**Marks and colors:** Original #089981 / #f23645 buy/sell and gray neutral accents.

**Limits:** The original tick mode needs every live update and cannot be recovered from 15-second OHLCV snapshots. Only the LTF mode can be ported here.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/volume_delta_candles.pinescript).

### Volume Profile · Node Detection

**Preset:** 360 bars · 100 rows · VA70% · peak 9%. **Author:** LuxAlgo.

Detects high/low-volume nodes within a lower-timeframe volume profile. Compare volume peaks with neighboring rows; value-area colors show where the selected percentage of distributed volume resides.

**Marks and colors:** Original blue/yellow value area and gray profile rows.

**Limits:** Lower-timeframe bars and adequate coverage are required; unavailable second-based inputs must be reported, not replaced silently.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/volume_profile_with_node_detection.pinescript).

### Volumetric Order Flow Structure

**Preset:** Pivot 3 · 15 synthetic rows · max 5 blocks. **Author:** LuxAlgo.

Draws structure breaks with synthetic order-block profiles and manipulation marks. Read BOS/CHoCH first, then compare surviving block rows and orange profile emphasis.

**Marks and colors:** Original green/red blocks and orange POC-like row.

**Limits:** The profile uses body-distance row weights from the source, not measured volume-at-price. Its appearance is a visualization convention.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/volume-order-flow/volumetric_order_flow_structure.pinescript).

## Timeframes and sessions

### HTF Reversal & Divergences

**Preset:** 15m patterns · RSI divergence · PO3. **Author:** LuxAlgo.

Combines higher-timeframe engulfing/pin-bar patterns with RSI pivot divergence and a forming HTF projection. Check that the source timeframe is valid, then compare confirmed HTF patterns with price/RSI divergence.

**Marks and colors:** Original green/red patterns and divergences, neutral gray forming context.

**Limits:** Requested HTF delivery timing, pivot confirmation and the loaded history can affect when a mark first becomes available.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/timeframes-sessions/HTF_reversal_divergences.pinescript).

### HTF PO3

**Preset:** 1H source · live projection offset 15 bars. **Author:** LuxAlgo.

Projects the forming 1H candle and maps its open/high/low back to their chart-bar origins. Use the dashed origin connectors to understand the developing HTF body/wicks; the delta label uses chart-bar polarity.

**Marks and colors:** Original green/red candle with neutral-gray open connector.

**Limits:** Use an interval at or below 1H that divides 1H. The right-hand candle is a current aggregate, not a future-price forecast.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/timeframes-sessions/htf_po3.pinescript).

### ICT Killzones Toolkit

**Preset:** Sessions UTC−5 · chart ≤15m. **Author:** LuxAlgo.

Highlights Asian/London/New York killzones and structures, blocks and gaps formed around them. Compare session high/low and mean with the structural layers formed during each window.

**Marks and colors:** Pink Asia, cyan London, orange NY AM and blue NY PM with translucent session backgrounds.

**Limits:** The original uses fixed UTC−5, not automatic New York DST; the default session display applies through 15-minute charts.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/timeframes-sessions/ICT_killzones_toolkit.pinescript).

## Signal evaluation

### Universal Signal Backtester

**Preset:** Default EMA9/21 · ATR14 targets/stops. **Author:** LuxAlgo.

Evaluates hypothetical signals with target/stop rules and a results dashboard. Read sample count, unresolved position and the stated fill convention before interpreting TP/SL hit rates.

**Marks and colors:** Original green/red outcomes and target/stop rails.

**Limits:** External TradingView input.source streams are unavailable here. An OHLC-based simulation cannot recover true intrabar fill order or represent live execution.

[Supplied Pine reference](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/signal-evaluation/universal_signal_backtester.pinescript).

## Explicit implementation differences

- **Support & Resistance Signals MTF:** chart-timeframe pivot15 preset, buffered
  break/test/retest and manipulation zones. The symmetric zone state machine is
  a source-derived adaptation; the original's asymmetric array/dummy-zone edge
  cases, volume-spike/wick-rejection decorations and individual tooltip strings
  are not reproduced. It does not fetch HTF candles.
- **HTF Reversal:** RSI14/divergence remains available on larger charts, while
  15m patterns require a chart interval ≤15m. Source-close availability is used
  consistently, rather than reproducing the historical/realtime discrepancy of
  `request.security(..., [1])` with default lookahead-off. The optional PO3
  projection is off; choose the separate HTF PO3 preset for the live 1H projection.
  The source RSI gradient fill is not reproduced in this preset.
- **Volume Profile Nodes:** node rectangles align with the detected peak bin;
  the supplied source's shifted rectangle indexing is not reproduced. Optional
  trough/cluster/highest-N/lowest-N modes and developing POC remain off.
- **Liquidity Structure:** numerical bins, smoothing, value area, void, depth
  curves, polarity delta and volume-outlier conditions are retained. Bubble
  layout uses compact labels instead of the original three-lane size system.
- **Volumetric Structure:** body-distance row weights are retained. Manipulation
  marks use compact circles instead of varying Pine label sizes and volume text;
  ornamental glow rendering is reduced. This synthetic profile is not measured
  volume-at-price, despite broader claims in the author's prose.
- **Clusters Volume Profile:** clustering, per-cluster bins and price dots are
  retained; metric text is compact rather than matching every original label.
- **NomadaScalper:** earlier H4 contacts outside loaded main-chart history can
  only be established at source-candle resolution; exact old wick locations and
  first-contact timestamps are not invented. Original visible-range relief
  offsets/glow and coincident-price decorative merging are simplified.
- **Trendline Navigator:** default chart-timeframe fitting is bounded to avoid
  an unbounded Pine while loop on degenerate anchors; optional HTF selection,
  HH/LL annotations, candle/background coloring are not exposed.
- **Pivot Missed Reversals:** missing initialization extrema are omitted instead
  of constructing zero-price anchor artifacts.
- **Universal Signal Backtester:** default EMA9/21, ATR14, equal 1/3 TP exits at
  ×1/2/3, SL distances ×1.5/2.5/3.5, SL before TP on ambiguous OHLC bars, opposite
  signal close, no costs. Trading begins after ATR warm-up instead of using a
  zero-distance initial ATR. Realized P&L and drawdown are reported per one unit
  in quote-price units, not Pine ticks. Unclosed positions are excluded from
  closed-trade totals. Monthly/hourly heatmaps, suggested-TP optimization,
  external source modes and optional cost/target inputs are not exposed.
- **Other presets:** use the described default formulas/layers. Their optional
  settings and TradingView's alert service are not replicated. Point labels,
  fonts, gradients and layering can differ from the original renderer.

## Implementation and licensing

Calculation modules return validated-by-contract plot/geometry descriptions,
not chart objects. `BuiltinRenderer` owns series and primitive attachment;
`IndicatorPrimitive` draws through the public Lightweight Charts API. No core
library source is copied or patched. The official [plugin guide](https://tradingview.github.io/lightweight-charts/docs/plugins/intro)
and [working examples](https://tradingview.github.io/lightweight-charts/plugin-examples/)
cover primitives, trendlines, rectangles and volume profiles.

28 LuxAlgo source-derived presets retain **CC BY-NC-SA 4.0**, with attribution,
noncommercial and ShareAlike conditions. The two supplied NomadaScalper/LunqFX
references have no local license declaration; no permission or MIT relicensing
is asserted for those portions. See the packaged [notice](../third-party/indicator-adaptations-NOTICE.txt).
The separately authored original presets and core extension retain their own
license; these adaptations must not be described as entirely MIT.

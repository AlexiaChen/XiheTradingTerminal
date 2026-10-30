/** Pine-source adaptations. Metadata and guides stay independent of chart rendering. */
export const PINE_INDICATORS = [
  {
    "id": "evasive-supertrend",
    "name": "Evasive SuperTrend",
    "category": "trend",
    "parameters": "ATR10 × 3 · noise 1 ATR · expansion 0.5 ATR",
    "pane": false,
    "source": "trend/evasive_supertrend.pinescript",
    "guide": {
      "summary": "Bands retreat from nearby price to reduce noise-driven trend flips.",
      "usage": "Follow solid trend bands; dotted sections show noise expansion. BULL/BEAR labels mark a band crossing.",
      "signals": "Green #089981 / red #f23645; gradient fill between price midpoint and band.",
      "limitations": "A forming candle can change the signal; the band can move away from price, unlike ordinary Supertrend.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "trendline-navigator",
    "name": "Trendline Breakout Navigator",
    "category": "trend",
    "parameters": "Long / medium / short 60 / 30 / 10",
    "pane": false,
    "source": "trend/trendline_breakout_navigator.pinescript",
    "guide": {
      "summary": "Tracks multiple swing horizons and adapts trendlines after new higher/lower pivots.",
      "usage": "Compare the active trendline with close and wick-break dots; use the selected long horizon for the main state.",
      "signals": "Green/red lines; blue/orange wick dots.",
      "limitations": "Pivots require confirmation; historical line anchors are retrospective. The preset uses the chart timeframe.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "trendline-hold-rate",
    "name": "Trendlines · Breakouts, Touches & Hold Rate",
    "category": "trend",
    "parameters": "Swing 8 · tolerance 0.25 ATR · 20-bar evaluation",
    "pane": false,
    "source": "trend/trendlines_breakouts_touches_hold_rate.pinescript",
    "guide": {
      "summary": "Fits lines through confirmed swings and counts touches, breaks and retests.",
      "usage": "Watch confirmed closes beyond a line, then a retest; inspect resolved and pending sample counts in the dashboard.",
      "signals": "Blue support and magenta resistance; labels distinguish touches, breaks and retests.",
      "limitations": "Observed hold rates depend on this loaded sample and ATR target/window; they are not forecasts.",
      "author": "LunqFX"
    }
  },
  {
    "id": "sr-breaks",
    "name": "Support & Resistance Levels with Breaks",
    "category": "support-resistance",
    "parameters": "Pivots 15 / 15 · volume oscillator >20",
    "pane": false,
    "source": "support-resistance/support_and_resistance_levels_with_breaks.pinescript",
    "guide": {
      "summary": "Pivot support/resistance rails with volume-qualified breaks and wick labels.",
      "usage": "B marks a close crossing with sufficient volume. Bull/Bear Wick marks the script’s candle-shape condition.",
      "signals": "Red resistance #FF0000; blue support #233dee; green/red signal labels.",
      "limitations": "Rails are offset back 16 bars after confirmation. A displayed origin is not the time the level became known.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "sr-mtf",
    "name": "Support & Resistance Signals MTF",
    "category": "support-resistance",
    "parameters": "Chart timeframe · pivot 15 · zone margin 2",
    "pane": false,
    "source": "support-resistance/support_and_resistance_signals_MTF.pinescript",
    "guide": {
      "summary": "Tracks support/resistance zones, false breaks, tests, retests and manipulation zones.",
      "usage": "Distinguish a zone rejection from a close through it; tests and retests refer to different zone states.",
      "signals": "Green support, red resistance, blue/orange manipulation zones.",
      "limitations": "The source scales pivot lookback by a timeframe ratio; it does not request independently aggregated HTF candles.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "sr-pro",
    "name": "Support Resistance Pro Toolkit",
    "category": "support-resistance",
    "parameters": "Donchian 10 · ATR200 × 0.5 · max 5 active",
    "pane": false,
    "source": "support-resistance/support_resistance_pro_toolkit.pinescript",
    "guide": {
      "summary": "Detects zones and monitors their touch bars, sweeps, volume and lifetime.",
      "usage": "Use unbroken zones as areas of interest; ✖ marks a close through the boundary. Compare entries, sweeps and duration.",
      "signals": "Green support #089981 and red resistance #f23645.",
      "limitations": "This preset uses the original default Donchian method. Touching-bar counts are not independent trades or predictive strength.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "pivot-missed",
    "name": "Pivot Points · Missed Reversals",
    "category": "support-resistance",
    "parameters": "Pivot length 50 · regular and ghost pivots",
    "pane": false,
    "source": "support-resistance/pivot_points_high_low_missed_reversal_levels.pinescript",
    "guide": {
      "summary": "Adds missed extremes between regular pivots and connects them with a ZigZag.",
      "usage": "Triangles mark regular pivots; ghosts mark missed reversals. Ghost rails can be used as contextual support/resistance.",
      "signals": "Red highs #ef5350; green lows #26a69a; missed links are dashed.",
      "limitations": "Confirmed pivots arrive 50 bars after their origin. The latest ghost can move until the next pivot confirms.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "nomada-levels",
    "name": "SellSide BuySide · NomadaScalper",
    "category": "support-resistance",
    "parameters": "Completed 4H extremes · previous day/week",
    "pane": false,
    "source": "support-resistance/sellside_buyside_nomada_scalper.pinescript",
    "guide": {
      "summary": "Maps completed H4 high/low levels and previous daily/weekly extremes.",
      "usage": "Solid rails begin when a completed source candle becomes available and stop at first contact; dotted segments show origin context.",
      "signals": "Teal highs/lows and rose counterpart levels; blue/yellow daily, gold weekly references.",
      "limitations": "Requires H4 or a lower interval dividing H4. This is a level map, not an entry system or probability model.",
      "author": "NomadaScalper"
    }
  },
  {
    "id": "breakout-retest",
    "name": "Swing Breakouts · Tests & Retests",
    "category": "support-resistance",
    "parameters": "Pivots 10 / 1 · ATR200 width · 500 bars",
    "pane": false,
    "source": "support-resistance/breakouts_with_tests_retests.pinescript",
    "guide": {
      "summary": "Follows swing zones through their original and broken/retested states.",
      "usage": "▲/▼ identify tests; hollow △/▽ identify retests after a zone changes state.",
      "signals": "Green/red translucent zones retain the original #08998145 / #f2364545 palette.",
      "limitations": "The right edge can move back to the last retest after timeout; a historical zone is not a live entry instruction.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "liquidity-sweeps",
    "name": "Liquidity Sweeps",
    "category": "market-structure",
    "parameters": "Swings 5 · Only Wicks · extend 300 bars",
    "pane": false,
    "source": "market-structure/liquidity_sweeps.pinescript",
    "guide": {
      "summary": "Detects a wick through a confirmed liquidity level followed by a close back inside.",
      "usage": "Watch the highlighted wick-to-level zone and short opposite-wick dotted rail for subsequent reactions.",
      "signals": "Green bullish/red bearish; dotted swept level and translucent sweep area.",
      "limitations": "The preset follows original Only Wicks defaults; it does not enable the optional breakout-and-retest detection mode.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "pa-liquidity-sweeps",
    "name": "Pure Price Action Liquidity Sweeps",
    "category": "market-structure",
    "parameters": "Long-term three-level swing hierarchy",
    "pane": false,
    "source": "market-structure/pure_price_action_liquidity_sweeps.pinescript",
    "guide": {
      "summary": "Finds liquidity sweeps using nested short/intermediate/long price patterns.",
      "usage": "A wick outside a long-term swing followed by an inside close creates a small sweep area.",
      "signals": "Green bullish #08998180 and red bearish #f2364580 sweep boxes.",
      "limitations": "Long-term pivots need later confirming patterns; their historical origin was not actionable in advance.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "pa-structures",
    "name": "Pure Price Action Structures",
    "category": "market-structure",
    "parameters": "Short / intermediate / long-term structures",
    "pane": false,
    "source": "market-structure/pure_price_action_structures.pinescript",
    "guide": {
      "summary": "Builds three nested price-pattern hierarchies and marks structural closes.",
      "usage": "BOS continues the current structural direction; MSS changes it. Compare the three line styles for scale.",
      "signals": "Dotted ST, dashed IT and solid LT; green bullish/red bearish; long-term pivot circles.",
      "limitations": "Nested pivots are confirmed later than their origin. BOS/MSS labels describe structural state, not guaranteed continuation.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "swing-sequence",
    "name": "Swing Breakout Sequence",
    "category": "market-structure",
    "parameters": "Swing 5 · internal 2 · default pattern filters",
    "pane": false,
    "source": "market-structure/swing_breakout_sequence.pinescript",
    "guide": {
      "summary": "Detects ordered swing breakout patterns with internal points and optional double top/bottom context.",
      "usage": "Read the numbered sequence in order and distinguish the pattern’s bounds from later price action.",
      "signals": "Original green/red paths, translucent boxes and numbered points.",
      "limitations": "Pattern anchors are retrospective confirmed swings; a detected pattern does not predict its outcome.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "msb-ob-score",
    "name": "Market Structure Break · OB Toolkit",
    "category": "market-structure",
    "parameters": "Momentum Z-score · volume percentile · OB zones",
    "pane": false,
    "source": "market-structure/market_structure_break_OB_probability_toolkit.pinescript",
    "guide": {
      "summary": "Filters structure breaks with momentum and scores associated order blocks.",
      "usage": "Watch MSB labels and shaded OBs; a higher percentage reflects the formula’s momentum/volume score.",
      "signals": "Green/red MSB and OBs; brighter high-score zones.",
      "limitations": "The percentage is a quality score, not a calibrated win probability; mitigation rate is sample-specific.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "imfvg",
    "name": "FVG Instantaneous Mitigation",
    "category": "fvg-ict",
    "parameters": "Width filter 0 · ATR200 trailing ×3",
    "pane": false,
    "source": "fvg-ict/FVG_instantaneous_mitigation_signals.pinescript",
    "guide": {
      "summary": "Finds gaps mitigated immediately on the next bar, with sentiment opposite to the original gap.",
      "usage": "Arrows mark mitigation; the dashed average extends until crossed in the opposite direction. The trailing line follows the active bias.",
      "signals": "Teal bullish, red bearish; gap fills retain 50% transparency.",
      "limitations": "Optional source TP/SL areas default off. Source candle recoloring is omitted to preserve the shared Gruvbox candles.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "ict-unicorn",
    "name": "ICT Unicorn Model",
    "category": "fvg-ict",
    "parameters": "Swings 10 · risk/reward 1:1",
    "pane": false,
    "source": "fvg-ict/ICT_unicorn_model.pinescript",
    "guide": {
      "summary": "Combines a breaker block and overlapping fair-value gap in a four-swing structure.",
      "usage": "Wait for the structure and FVG overlap, then watch its trigger, invalidation swing and target area.",
      "signals": "Green/red FVG; gray risk and blue reward areas.",
      "limitations": "A projection/target box is conditional geometry, not an order. Pivot confirmation and current-bar changes matter.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "pa-ict",
    "name": "Pure Price Action ICT Tools",
    "category": "fvg-ict",
    "parameters": "Nested swings · structures · blocks · liquidity voids",
    "pane": false,
    "source": "fvg-ict/pure_price_action_ICT_tools.pinescript",
    "guide": {
      "summary": "Combines hierarchical price-action structures with liquidity, order/breaker blocks and voids.",
      "usage": "Use the individual labeled layers together; a liquidity void is an area of imbalance rather than an automatic reversal signal.",
      "signals": "Original green/red structures and translucent gray void/order-block styling.",
      "limitations": "Several retrospective layers share the loaded history; recent-window modes and confirmation affect what remains visible.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "smc",
    "name": "Smart Money Concepts",
    "category": "fvg-ict",
    "parameters": "Internal 5 · swing 50 · default SMC layers",
    "pane": false,
    "source": "fvg-ict/smart_money_concepts.pinescript",
    "guide": {
      "summary": "Marks internal/swing BOS and CHoCH, order blocks, equal highs/lows and premium/discount areas.",
      "usage": "Compare internal and swing structure, then inspect the unmitigated OBs and nearby equal highs/lows.",
      "signals": "Original green/red structure and blue/red order-block palette.",
      "limitations": "Default FVG/HTF overlays are off. Community Pine is not executed; source bar recoloring is omitted for Gruvbox consistency.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "clusters-vp",
    "name": "Clusters Volume Profile",
    "category": "volume-order-flow",
    "parameters": "200 bars · 5 clusters · 50 iterations · 20 rows",
    "pane": false,
    "source": "volume-order-flow/clusters_volume_profile.pinescript",
    "guide": {
      "summary": "Groups candle midpoints into volume-weighted K-means clusters and builds a profile per cluster.",
      "usage": "Match colored price dots with the same cluster’s horizontal volume rows; compare concentration rather than direction.",
      "signals": "Original blue/red/green/orange/purple cluster palette.",
      "limitations": "Clusters can reassign when the latest window changes. Price-bin volume is distributed from candles, not measured individual trades.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "delta-flow",
    "name": "Delta Flow Profile",
    "category": "volume-order-flow",
    "parameters": "360 bars · 25 rows · polarity · money flow",
    "pane": false,
    "source": "volume-order-flow/delta_flow_profile.pinescript",
    "guide": {
      "summary": "Shows money flow and estimated polarity delta at price, with a developing POC.",
      "usage": "Compare row widths and blue/red dominance, then inspect the POC path for the highest-flow region.",
      "signals": "Blue #5288C4, red #f7525f and red POC #f23645.",
      "limitations": "Money flow multiplies distributed volume by bin price. Candle polarity estimates buying/selling and is not actual aggressor classification.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "institutional-flow",
    "name": "Institutional Order Flow Strength",
    "category": "volume-order-flow",
    "parameters": "Pivot 5 · 5 OBs · strongest buffer 5",
    "pane": false,
    "source": "volume-order-flow/institutional_order_flow_strength_classifier.pinescript",
    "guide": {
      "summary": "Ranks unmitigated structure-break order blocks by displacement and relative volume.",
      "usage": "Compare percentage scores and the highlighted strongest zone; a broken zone is removed from consideration.",
      "signals": "Original green/red zones and strongest-zone fill.",
      "limitations": "The name does not imply institutional order data: the score uses OHLCV. It is not a win probability.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "liquidity-delta",
    "name": "Liquidity Delta Profiler",
    "category": "volume-order-flow",
    "parameters": "Liquidity zones · 4 quadrants · decay / reaction stats",
    "pane": false,
    "source": "volume-order-flow/liquidity_delta_profiler.pinescript",
    "guide": {
      "summary": "Divides pivot liquidity zones into quadrants and tracks estimated delta consumption and reactions.",
      "usage": "Watch zone consumption and sweeps; use the reaction dashboard to see resolved/pending observations.",
      "signals": "Original green/red quadrant gradients; teal/yellow reaction emphasis.",
      "limitations": "Delta is volume × (close-open)/(high-low), allocated by overlap. Zone capacity and reaction rates are model assumptions.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "liquidity-depth",
    "name": "Liquidity Structure & Order Flow",
    "category": "volume-order-flow",
    "parameters": "300 bars · 150 bins · smoothing 3 · VA70%",
    "pane": false,
    "source": "volume-order-flow/liquidity_structure_order_flow.pinescript",
    "guide": {
      "summary": "Combines a close-price volume heatmap, delta backdrop, depth curves, value area and unusual-volume bubbles.",
      "usage": "Read POC/VAH/VAL, widest low-volume void and high-RVOL bubbles alongside the distribution curves.",
      "signals": "Green lower depth, red upper depth, orange POC; original intensity/transparency gradients.",
      "limitations": "Depth curves are inferred volume distributions, not live order-book depth. Polarity delta and repainting latest-window bins are explicit estimates.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "volume-delta",
    "name": "Volume Delta Candles",
    "category": "volume-order-flow",
    "parameters": "Lower-timeframe polarity · no historical tick emulation",
    "pane": false,
    "source": "volume-order-flow/volume_delta_candles.pinescript",
    "guide": {
      "summary": "Shows lower-timeframe up/down volume as a colored fraction of each chart candle.",
      "usage": "Compare the delta-colored body fraction with total candle range; positive and negative delta can disagree with the chart candle direction.",
      "signals": "Original #089981 / #f23645 buy/sell and gray neutral accents.",
      "limitations": "The original tick mode needs every live update and cannot be recovered from 15-second OHLCV snapshots. Only the LTF mode can be ported here.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "volume-nodes",
    "name": "Volume Profile · Node Detection",
    "category": "volume-order-flow",
    "parameters": "360 bars · 100 rows · VA70% · peak 9%",
    "pane": false,
    "source": "volume-order-flow/volume_profile_with_node_detection.pinescript",
    "guide": {
      "summary": "Detects high/low-volume nodes within a lower-timeframe volume profile.",
      "usage": "Compare volume peaks with neighboring rows; value-area colors show where the selected percentage of distributed volume resides.",
      "signals": "Original blue/yellow value area and gray profile rows.",
      "limitations": "Lower-timeframe bars and adequate coverage are required; unavailable second-based inputs must be reported, not replaced silently.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "volumetric-structure",
    "name": "Volumetric Order Flow Structure",
    "category": "volume-order-flow",
    "parameters": "Pivot 3 · 15 synthetic rows · max 5 blocks",
    "pane": false,
    "source": "volume-order-flow/volumetric_order_flow_structure.pinescript",
    "guide": {
      "summary": "Draws structure breaks with synthetic order-block profiles and manipulation marks.",
      "usage": "Read BOS/CHoCH first, then compare surviving block rows and orange profile emphasis.",
      "signals": "Original green/red blocks and orange POC-like row.",
      "limitations": "The profile uses body-distance row weights from the source, not measured volume-at-price. Its appearance is a visualization convention.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "htf-reversal",
    "name": "HTF Reversal & Divergences",
    "category": "timeframes-sessions",
    "parameters": "15m patterns · RSI divergence · PO3",
    "pane": false,
    "source": "timeframes-sessions/HTF_reversal_divergences.pinescript",
    "guide": {
      "summary": "Combines higher-timeframe engulfing/pin-bar patterns with RSI pivot divergence and a forming HTF projection.",
      "usage": "Check that the source timeframe is valid, then compare confirmed HTF patterns with price/RSI divergence.",
      "signals": "Original green/red patterns and divergences, neutral gray forming context.",
      "limitations": "Requested HTF delivery timing, pivot confirmation and the loaded history can affect when a mark first becomes available.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "htf-po3",
    "name": "HTF PO3",
    "category": "timeframes-sessions",
    "parameters": "1H source · live projection offset 15 bars",
    "pane": false,
    "source": "timeframes-sessions/htf_po3.pinescript",
    "guide": {
      "summary": "Projects the forming 1H candle and maps its open/high/low back to their chart-bar origins.",
      "usage": "Use the dashed origin connectors to understand the developing HTF body/wicks; the delta label uses chart-bar polarity.",
      "signals": "Original green/red candle with neutral-gray open connector.",
      "limitations": "Use an interval at or below 1H that divides 1H. The right-hand candle is a current aggregate, not a future-price forecast.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "ict-killzones",
    "name": "ICT Killzones Toolkit",
    "category": "timeframes-sessions",
    "parameters": "Sessions UTC−5 · chart ≤15m",
    "pane": false,
    "source": "timeframes-sessions/ICT_killzones_toolkit.pinescript",
    "guide": {
      "summary": "Highlights Asian/London/New York killzones and structures, blocks and gaps formed around them.",
      "usage": "Compare session high/low and mean with the structural layers formed during each window.",
      "signals": "Pink Asia, cyan London, orange NY AM and blue NY PM with translucent session backgrounds.",
      "limitations": "The original uses fixed UTC−5, not automatic New York DST; the default session display applies through 15-minute charts.",
      "author": "LuxAlgo"
    }
  },
  {
    "id": "signal-backtester",
    "name": "Universal Signal Backtester",
    "category": "signal-evaluation",
    "parameters": "Default EMA9/21 · ATR14 targets/stops",
    "pane": false,
    "source": "signal-evaluation/universal_signal_backtester.pinescript",
    "guide": {
      "summary": "Evaluates hypothetical signals with target/stop rules and a results dashboard.",
      "usage": "Read sample count, unresolved position and the stated fill convention before interpreting TP/SL hit rates.",
      "signals": "Original green/red outcomes and target/stop rails.",
      "limitations": "External TradingView input.source streams are unavailable here. An OHLC-based simulation cannot recover true intrabar fill order or represent live execution.",
      "author": "LuxAlgo"
    }
  }
] as const;

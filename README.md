# XiheTradingTerminal

<img src="media/xihe.png" alt="XiheTradingTerminal: Weiji hexagram with forty-nine points and one empty position" width="96" align="right" />

Named after **Xihe (羲和)**, the solar goddess associated with time and celestial cycles. The mark is **Weiji (未济), Hexagram 64**: fire above water. Its forty-nine dots occupy a fifty-position ring, leaving one gap.

**Version 1.0.0** pairs TradingView's hosted main chart with a simultaneous **Lightweight Charts 5.2.1 indicator preview**. Compare the main chart's drawing tools with local TypeScript and JavaScript indicators on the same market and timeframe. Wide windows show both charts side by side; narrow sidebars stack them.

![Hosted ETH main chart beside the live local indicator preview](doc/assets/gruvbox-dark.png)

The preview follows symbol and interval changes inside the main chart without rebuilding its iframe. Named workspaces, independent chart tabs and Gruvbox colors remain available.

## Features

- **Main chart + indicator preview:** both charts stay visible. Use the hosted controls and drawing tools alongside local indicators; there is no engine-switching tab.
- **Local JavaScript indicators:** load a `.js` file into a Lightweight chart. Indicator code and names are saved with that chart. Computation runs in a Worker with a two-second limit.
- **43 optional local presets:** 13 original presets plus 30 source-derived Pine adaptations, organized into eight categories. Search and select several across categories; each chart saves its own overlay stack.
- **Guides and chart annotations:** applied-indicator chips provide hover/focus/click guides based on source calculations and the authors' notes. Source-colored key points, zones, trendlines, profiles and compact statistics appear on the native chart.
- **One market-data service:** the extension host subscribes anonymously to the service used by the hosted Widget. Stocks and other available Widget markets work alongside crypto. No Binance REST API, account, API key, browser installation or companion process is required. The preview requests 1,000 bars, receives live updates, reconnects with fresh history, and pauses hidden subscriptions. Actual history and delays depend on the source.
- **Named workspaces:** group charts by market, strategy, or trading session. Create, switch, rename, and remove workspaces inside the sidebar.
- **Independent chart tabs:** rename charts with the pencil button or a double-click. Each tab keeps its symbol, interval, theme, and additional indicators.
- **Start with ETH / 4H:** new workspaces open `BINANCE:ETHUSDT` at four-hour resolution, with Settings collapsed by default. Existing saved configurations are retained.
- **Indicators ready on open:** every new chart includes **ZigZag (5% deviation, depth 10)** and **Simple Moving Average (90)**. Existing saved indicators are retained when migrating older settings.
- **Keep charts alive:** switching tabs or workspaces reuses the existing TradingView iframe, preserving indicator adjustments made inside that chart during the session.
- **Gruvbox Dark and Light:** mist-blue up candles (`#83a598`), wheat-gold down candles (`#d79921`), and matching candle borders, wicks, and backgrounds. The palette follows the sibling `kline-trainer` project.
- **Collapsible controls:** hide settings to give the chart more space. Layout and controls use Tailwind CSS 4.
- **Workspace persistence:** chart configuration, names, active selections, and toolbar visibility are saved in the current VS Code project.

<details>
<summary>Both charts in a narrow Gruvbox Light sidebar</summary>

<img src="doc/assets/gruvbox-light.png" alt="Gruvbox Light sidebar with ZigZag and MA 90" width="420" />

</details>

Screenshots use the current built Webview and extension-host feed code with a preview-only VS Code API shim, real hosted charts and real streamed candles. They are browser validation, not screenshots from a running VS Code extension host.

## Install locally

Requirements: **VS Code 1.108.1 or newer**, and internet access for TradingView charts.

To build your own installer, use **Node.js 24**:

```bash
npm install
npm run package
```

The packaging tool, `@vscode/vsce`, is installed as a local development dependency. No global installation, Marketplace account, or CI run is needed. Packaging builds the extension and Webview with Vite; **it does not run tests**.

The installer is written to:

```text
dist/xihe-trading-terminal-1.0.0.vsix
```

Extension ID: `AlexiaChen.xihe-trading-terminal`. This renamed extension has a separate identity from the original TradingView Sidebar; its saved settings are not automatically shared with that extension.

In your host machine's VS Code:

1. Open **Extensions**.
2. Select **… → Install from VSIX…**.
3. Select the generated `.vsix` file, install it, and reload VS Code if prompted.
4. Open the **XiheTradingTerminal** icon in the Activity Bar.

If you build in WSL and use VS Code on Windows, select the file from the host VS Code installation dialog and install it in the local extension environment.

## Use the chart workspace

1. Use **+ Workspace** to create a chart workspace, then give it a name. Switch workspaces with the dropdown; use **Rename** to change a name later.
2. Use **+ Chart** to copy the current chart's configuration into a new tab. Rename a tab with its pencil button or by double-clicking its label.
3. Set the symbol with TradingView notation, such as `BINANCE:BTCUSDT` or `NASDAQ:AAPL`.
4. Choose an interval and a Gruvbox theme. ZigZag and MA 90 are included automatically; use **Main chart indicators** for supported built-in IDs, such as `RSI@tv-basicstudies`.
5. Use **Hide Settings** to maximize the chart. At least one workspace and one chart are retained.

Both charts appear together. Settings change the main configuration; changes made inside the hosted chart are followed in the preview during the session. The **Following main** label reports the effective symbol and interval. While the main chart is unconfirmed, the preview explicitly follows Settings instead. A main-chart selection that resolves to a different source is shown honestly: `NASDAQ:AAPL` was observed as `BATS_DLY:AAPL`, Cboe One, delayed 15 minutes.

The extension opens a separate read-only connection to the same Widget service; it does not read the iframe DOM or share an identical socket. Updates can arrive at slightly different times. Panning, drawings and crosshairs remain independent. The preview requests regular-session, split-adjusted candles; extended-hours, replay and transformed chart-style settings inside the main chart are not mirrored. Existing workspaces, JS snapshots, extra studies and local selections migrate; the old saved engine field is retained for compatibility and no longer hides either chart.

![US stocks: hosted Apple chart with a local indicator preview and visible source/delay](doc/assets/us-stocks.png)

## Built-in local indicators

Select **Built-in Indicators**, choose a category, and check several presets. Search names, parameters or Chinese keywords (`MACD`, `斐波那契`, `流动性`, `订单流`). Category filters and searches keep hidden selections intact, so overlays from different categories remain combined. Use arrow keys through results, Enter in search to toggle the first result, and Escape or an outside click to close.

**Applied** chips list your entire selection. Hover, focus, or click a chip for its basic usage, colors, source attribution and limitations; use × to remove just that preset. Expand **Indicator notes** for current coverage and calculation limits, or a compact dashboard for observed statistics.

MA(90) and ZigZag(5%, 10) stay on; optional presets start off in new charts. Each chart saves its own selections, and copying a chart copies those selections independently.

| Overlay presets | Separate-pane presets |
| --- | --- |
| Auto Fib Retracement: latest confirmed ZigZag swing | Volume |
| EMA Ribbon: 20 / 50 / 200 | RSI: Wilder 14 |
| Bollinger Bands: SMA20, 2σ | MACD: 12 / 26 / 9 |
| Donchian Channels: 20 | Stochastic: 14 / 3 / 3 |
| Keltner Channels: EMA20, ATR10 × 2 | ATR: Wilder 14 |
| Supertrend: ATR10 × 3 | Squeeze Momentum: 20, BB2, KC1.5 |
| Session VWAP: HLC3, UTC day | |

![FVG and ICT picker with Smart Money Concepts selected alone](doc/assets/builtin-indicators.png)

Feature view: Smart Money Concepts selected alone from FVG & ICT, alongside the hosted main chart. Searching and category changes keep the charts in place; changing the selection rebuilds only that preview. See the [Built-in Indicator Showcase](doc/built-in-indicator-showcase.md) for screenshots covering most presets across categories.

[See applied-chip guides and the full screenshot gallery](doc/built-in-indicator-showcase.md).

The applied-chip guide explains how to read the marked sweeps and zones. It is available on hover, keyboard focus and click, while the chart remains visible.

**Auto Fib Retracement measures pullback depth within one ZigZag swing.** The swing's endpoint is 0%, its starting point is 100%. Levels are 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6% and 100%; Indicator notes also reports the current retracement percentage. Negative or above-100% readings mean price is outside that swing. This preset has no extension levels, direction predictions or buy/sell signals. Its latest confirmed anchors may change as new swings develop.

The 13 original presets above use independently implemented formulas; see [their numerical conventions](doc/indicators.md). The additional source-derived presets are grouped as follows:

| Category | Examples |
| --- | --- |
| Trend & channels | Evasive SuperTrend, Trendline Navigator, Trendlines with Hold Rate |
| Momentum & volatility | RSI, MACD, Stochastic, ATR, Squeeze Momentum |
| Support & resistance | S/R Breaks, S/R MTF, S/R Pro, Missed Reversals, NomadaScalper, Tests & Retests |
| Structure & liquidity | Liquidity Sweeps, Pure Price Action Structures, Swing Breakout Sequence, MSB/OB Score |
| FVG & ICT | Instantaneous Mitigation, ICT Unicorn, Pure Price Action ICT, Smart Money Concepts |
| Volume & order flow | Cluster Profiles, Delta Flow, Liquidity Delta/Depth, Volume Delta, Volume Nodes, Volumetric Structure |
| Timeframes & sessions | HTF Reversal/Divergences, HTF PO3, ICT Killzones |
| Signal evaluation | Universal Signal Backtester (default EMA9/21 simulation) |

Each algorithm lives in its own TS file under `src/indicators/builtin/<category>/`; the supplied references use matching [category folders](https://github.com/AlexiaChen/XiheTradingTerminal/blob/main/third-party/tradingview-indicator/README.md). The [30-preset guide](doc/pine-indicators.md) documents usage, source colors, default settings and **implementation differences**. These are fixed adaptations of selected default layers, not full Pine or TradingView parity. Optional original inputs/alerts are not all exposed.

The library remains the pinned npm Lightweight Charts package. Our independent adapter uses its public primitives API; there is no maintained fork or core patch. Base candles retain Gruvbox, while indicator graphics follow the source palette where possible. OHLCV-derived delta and profiles are estimates. Lower-timeframe inputs use separate, bounded subscriptions to the same resolved Widget symbol; missing data produces a visible explanation. Tick reconstruction and external TradingView signal streams are unavailable.

## Write a local JavaScript indicator

Select **Load JS Indicator** and choose a self-contained `.js` file, such as [examples/indicators/ema-20.js](examples/indicators/ema-20.js). This requires a trusted VS Code workspace. Define a top-level `calculate(bars)` function:

```js
function calculate(bars) {
  let ema;
  const alpha = 2 / 21;
  return [{
    name: "EMA 20",
    color: "#b8bb26",
    data: bars.map(bar => {
      ema = ema === undefined ? bar.close : alpha * bar.close + (1 - alpha) * ema;
      return { time: bar.time, value: ema };
    })
  }];
}
```

Each bar contains `time` (Unix seconds, UTC), `open`, `high`, `low`, `close`, and `volume`. Return an array of plots with a `name`, hex `color`, and ascending `{ time, value }` points using candle timestamps. Optional `type: "histogram"` draws columns; `pane: 1` creates a separate indicator pane. The default is an overlaid line. Files cannot use imports, Node.js APIs, DOM access, or Pine Script.

Up to eight scripts of 64 KiB each can be saved per chart, with at most eight plots per script. Errors, invalid output and two-second timeouts are reported in the local chart. Use the **×** beside a script to remove it. The saved source is a snapshot: edit the file, remove the previous copy, and load it again to apply changes. Required MA and ZigZag presets remain present.

Local ZigZag uses depth-confirmed pivots and a 5% reversal threshold. Pivots are delayed by the confirmation window and the latest extreme may move; it is not a claim of bit-for-bit parity with the hosted TradingView indicator. Local charts use UTC and do not include the Widget's full drawing-tool collection.

## Saved settings and blank charts

Reinstalling the same extension can restore the VS Code project's saved chart configuration, including old SOLUSDT names and symbols. New defaults do not overwrite explicit saved choices. Use **+ Workspace** for a new ETH / 4H workspace, or edit and rename the existing chart.

**Reconnect Preview** restarts its feed and reloads history while preserving the main chart. **Reload Main Chart** explicitly recreates the hosted iframe and discards unsaved edits inside it. Network errors remain visible. The hosted page needs access to TradingView assets; the extension host needs `wss://widgetdata.tradingview.com`. It honors VS Code's `http.proxy`, then HTTP(S) proxy environment variables. Remote/WSL extension hosts make this connection from their own environment.

**XiheTradingTerminal: Reload Sidebar** rebuilds the view from saved configuration. Its command ID is `xihe-trading-terminal.reload`.

## TradingView capabilities and limits

- **Market access:** the preview uses an undocumented Widget feed protocol, not an official data API. Symbols, fallback sources, delays and history depend on TradingView and its providers; paid Supercharts entitlements are not imported. See the [Widget Data FAQ](https://www.tradingview.com/widget-docs/faq/data/) and [data-use terms](https://www.tradingview.com/policies/). This preview uses Lightweight Charts, not the separately licensed Advanced Charts product.
- **Coverage and sessions:** selected auxiliary streams retain at most 12,000 bars, and servers may return fewer. Missing intrabars and volume are never invented. Volume-dependent presets skip unavailable volume; user JS receives NaN. Short exchange sessions can leave incomplete groups. Nomada Levels, S/R MTF and HTF PO3 use fixed UTC HTF boundaries and are omitted for non-24x7 sessions pending exchange-session support.

This extension uses TradingView's official hosted widget, loaded from `s3.tradingview.com/tv.js`. Its available features differ from the full TradingView website.

- **Pine scripts:** neither engine executes Pine Script or imports arbitrary community Pine indicators. The local catalog includes 30 explicit TS adaptations of supplied references. The Widget's additional-indicator field accepts supported built-in IDs; user JS files use the contract above. See the [official widget FAQ](https://www.tradingview.com/widget-docs/faq/general/).
- **Effective timeframe:** the hosted Widget has been observed to fall back from requested 6h/8h to 1D. The warning remains and the preview follows the main chart's reported effective interval. Removing Binance REST also removes the former independent native-6h/8h path. The preview accepts minute intervals, 1D and 1W; unsupported main-chart resolutions display an error.
- **Indicator persistence:** chart-internal edits survive tab and workspace switches while the Webview remains alive. A full sidebar reload, VS Code restart, or change to symbol/interval/theme/additional indicators recreates the widget. The hosted API does not expose a full chart-layout export here; internal edits are not restored after recreation. The required defaults and indicators entered in the extension toolbar are restored.
- **Appearance:** TradingView's own menus, toolbars, and individual indicator colors may retain their standard styling. Instrument availability depends on TradingView's feeds and your network.

## Development

The project uses **Vite 8**, **Tailwind CSS 4**, **TypeScript 6**, **Vitest 5**, and **ESLint 10**. Development tooling runs on Node.js 24. The extension targets Node.js 22 and ES2024; the VS Code API typings stay aligned with the minimum supported VS Code version.

```bash
npm ci                   # install the locked toolchain
npm run build            # typecheck and build both Vite bundles
npm run watch            # watch extension and Webview assets
npm test                 # lint, typecheck, build, and offline regression tests
npm run package          # build a VSIX, without running tests
```

Press **F5 → Run Extension** to try the extension in your installed VS Code. Automated checks run offline and do not download or launch a separate VS Code installation.

GitHub Actions runs on pushes, pull requests, and manual dispatch. It installs locked dependencies, runs offline checks and tests, packages the extension, verifies the VSIX contents, and uploads a **xihe-trading-terminal-vsix** artifact. It does not publish to the Marketplace.

The [chart-library comparison and integration notes](doc/context/features/chart-engines.md) record the choice of Lightweight Charts over a general charting toolkit or the separately licensed Advanced Charts product.

`node_modules/`, `out/`, `dist/`, downloaded test installations, and VSIX files are generated locally and excluded from Git. The VSIX includes the compiled extension, Webview JavaScript/CSS, media, README, changelog, license, and screenshots.

Contributor guidance starts at [AGENTS.md](AGENTS.md). Architecture, feature behavior, and validation records are organized in [doc/context](doc/context/README.md).

## Privacy

The extension saves chart configuration and loaded JS source locally in VS Code workspace state and adds no telemetry of its own. Embedded charts connect to TradingView; the extension host makes an anonymous, read-only Widget feed connection for the preview and selected auxiliary timeframes. No account credentials, cookies or trading access are used. JS calculation runs in Workers, separately from the extension host and Webview DOM.

## License

[MIT for core extension code and independent presets](LICENSE), with source-specific exceptions.

The 28 LuxAlgo-derived presets retain **CC BY-NC-SA 4.0**. The two supplied NomadaScalper/LunqFX references have no local license declaration; no MIT relicensing or upstream permission is asserted. See the bundled [indicator attribution and license notice](third-party/indicator-adaptations-NOTICE.txt) and [per-preset scope](doc/pine-indicators.md).

Bundled [Lightweight Charts](https://github.com/tradingview/lightweight-charts) is licensed under Apache 2.0; its chart attribution remains visible. Third-party licenses and notices, including the bundled WebSocket/proxy dependencies, are included in [third-party](third-party).

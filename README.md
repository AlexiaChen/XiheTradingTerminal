# XiheTradingTerminal

<img src="media/xihe.png" alt="XiheTradingTerminal: Weiji hexagram with forty-nine points and one empty position" width="96" align="right" />

Named after **Xihe (羲和)**, the solar goddess associated with time and celestial cycles. The mark is **Weiji (未济), Hexagram 64**: fire above water. Its forty-nine dots occupy a fifty-position ring, leaving one gap.

A chart workspace for VS Code, with named workspaces, independent chart tabs, and a warm Gruvbox palette. Keep market charts beside your code without rebuilding your indicator setup every time you switch tabs.

![Gruvbox Dark workspace with named chart tabs, ZigZag and MA 90](doc/assets/gruvbox-dark.png)

## Features

- **Named workspaces:** group charts by market, strategy, or trading session. Create, switch, rename, and remove workspaces inside the sidebar.
- **Independent chart tabs:** rename charts with the pencil button or a double-click. Each tab keeps its symbol, interval, theme, and additional indicators.
- **Start with ETH / 4H:** new workspaces open `BINANCE:ETHUSDT` at four-hour resolution, with Settings collapsed by default. Existing saved configurations are retained.
- **Indicators ready on open:** every new chart includes **ZigZag (5% deviation, depth 10)** and **Simple Moving Average (90)**. Existing saved indicators are retained when migrating older settings.
- **Keep charts alive:** switching tabs or workspaces reuses the existing TradingView iframe, preserving indicator adjustments made inside that chart during the session.
- **Gruvbox Dark and Light:** mist-blue up candles (`#83a598`), wheat-gold down candles (`#d79921`), and matching candle borders, wicks, and backgrounds. The palette follows the sibling `kline-trainer` project.
- **Collapsible controls:** hide settings to give the chart more space. Layout and controls use Tailwind CSS 4.
- **Workspace persistence:** chart configuration, names, active selections, and toolbar visibility are saved in the current VS Code project.

<details>
<summary>Gruvbox Light in a narrow sidebar</summary>

<img src="doc/assets/gruvbox-light.png" alt="Gruvbox Light sidebar with ZigZag and MA 90" width="420" />

</details>

Screenshots show the built Webview running in a browser with a preview-only VS Code API shim and the real TradingView hosted chart.

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
dist/xihe-trading-terminal-0.0.2.vsix
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
4. Choose an interval and a Gruvbox theme. ZigZag and MA 90 are included automatically; use **Additional indicators** for supported built-in IDs, such as `RSI@tv-basicstudies`.
5. Use **Hide Settings** to maximize the chart. At least one workspace and one chart are retained.

**XiheTradingTerminal: Reload Sidebar** rebuilds the view from saved configuration. Its command ID is `xihe-trading-terminal.reload`.

## TradingView capabilities and limits

This extension uses TradingView's official hosted widget, loaded from `s3.tradingview.com/tv.js`. Its available features differ from the full TradingView website.

- **Community Pine scripts:** custom Pine Script indicators and strategies cannot be loaded into this widget. The additional-indicator field accepts supported built-in indicator IDs, not community script names or URLs. See the [official widget FAQ](https://www.tradingview.com/widget-docs/faq/general/).
- **6h / 8h:** the extension can save and request these intervals, but a real hosted-widget check with `BINANCE:SOLUSDT` on 2026-10-29 fell back to **1D** for both. A warning is shown for these selections. Check the interval inside the chart; actual 6h/8h support remains unresolved.
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

`node_modules/`, `out/`, `dist/`, downloaded test installations, and VSIX files are generated locally and excluded from Git. The VSIX includes the compiled extension, Webview JavaScript/CSS, media, README, changelog, license, and screenshots.

Contributor guidance starts at [AGENTS.md](AGENTS.md). Architecture, feature behavior, and validation records are organized in [doc/context](doc/context/README.md).

## Privacy

The extension saves its chart configuration locally in VS Code workspace state and adds no telemetry of its own. Embedded charts connect to TradingView under TradingView's own service policies.

## License

[MIT](LICENSE)

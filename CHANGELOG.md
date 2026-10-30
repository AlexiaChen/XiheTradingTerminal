# Change Log

## [1.0.1] - 2026-10-30

- Fix blank indicator previews caused by rejecting messages forwarded from VS Code's outer Webview frame. Validate the shared Webview origin while continuing to reject embedded TradingView messages; also restore host replies for JS imports and workspace removal.
- Add an XiheTradingTerminal Output log with host/proxy selection, subscription IDs, socket failures and retries, history counts, frontend receipt and first-render acknowledgements. Hide proxy credentials and avoid per-candle logging.
- Show an initial connection status immediately and keep initialization errors beside the preview. Add regression coverage for parent-frame messages, cross-origin spoofing, stale replies and diagnostic redaction.

## [1.0.0] - 2026-10-30

- Show the hosted main chart and Lightweight indicator preview together: side by side on wide windows and stacked in narrow sidebars. Retain cached main-chart instances and legacy workspace data.
- Follow main-chart symbol and effective interval changes using the Widget's messages, without iframe DOM injection. Keep chart panning, crosshairs and drawings independent.
- Replace all Binance REST polling, including auxiliary indicator data, with an anonymous read-only Widget feed connection in the extension host. Support Widget-available stocks and other markets, and display the actual source and delay.
- Reload bounded history on reconnect/resume, isolate stale subscriptions, coalesce live deltas and request selected auxiliary streams from the same resolved market. Honor VS Code/environment HTTP(S) proxies.
- Preserve missing volume, align intrabars to actual parent opens, and disclose incomplete coverage and unavailable exchange-session HTF presets.
- Separate preview reconnection from explicit main-chart reload; retain the 43 presets, per-chart guides and JS Worker contract.
- Refresh README screenshots, add the classified Built-in Indicator Showcase, ship dependency notices, and extend offline and live-browser validation. This does not claim a real VS Code host or remote CI run.

## [0.0.4] - 2026-10-30

- Add 30 source-derived TypeScript indicator presets alongside the original 13, with matching category directories for Pine references and TS algorithms. Preserve source attribution, license exceptions, and documented implementation differences.
- Add category filtering, cross-category overlay selection, applied chips and hover/focus/click usage guides based on the supplied source calculations and author notes.
- Render source-colored key points, zones, fills, trendlines, volume profiles and compact dashboards through an independent public-API Lightweight Charts primitive adapter; retain the npm library without a fork.
- Fetch selected auxiliary HTF/LTF streams with pagination, bounded caching and explicit missing-data behavior; document unavailable tick/external-source modes and quote-unit signal simulation.

- Use a searchable multi-select dropdown for built-in indicators, with English/Chinese keyword search, keyboard controls and outside/Escape dismissal; filtering preserves selections.
- Add a per-chart built-in indicator picker with 13 optional local JS presets: Auto Fib Retracement, EMA Ribbon, Bollinger/Donchian/Keltner Channels, Supertrend, Session VWAP, Volume, RSI, MACD, Stochastic, ATR and Squeeze Momentum.
- Measure Fibonacci pullbacks on the latest confirmed ZigZag swing, with 0–100% retracement levels and a current retracement percentage; omit extension levels and trading signals.
- Preserve mandatory MA90/ZigZag, custom JS, Widget instances and old workspace data. Migrate legacy local Volume/RSI selections without overriding an explicitly cleared selection.
- Split indicators into individual TypeScript modules under src/indicators/builtin, with shared math, types and a catalog.
- Document formulas, source references, warm-up conventions and numerical limitations; extend regression tests and refresh screenshots and package checks.

## [0.0.3] - 2026-10-30

- Add separate TradingView Widget / Lightweight Charts engine tabs, preserving each engine's instance when switching.
- Bundle official open-source Lightweight Charts 5.2.1 with Gruvbox styling and MA(90) / ZigZag(5%, 10) presets.
- Load Binance spot candles, including native 6h/8h; poll visible local charts every 15 seconds and catch up after hiding.
- Load and save local JavaScript indicators, calculated in Workers with validated output and a two-second timeout. Include an EMA(20) example.
- Preserve old symbols and names, extra studies, engine selection and JS source. Support Volume and RSI in local charts.
- Fix hidden loading errors in narrow sidebars; asynchronously load the hosted library and add Retry Chart.
- Update indirect tooling dependencies to resolve the npm audit findings.

## [0.0.2] - 2026-10-30

- Start new workspaces with ETHUSDT / 4H and Settings collapsed; preserve saved configurations.
- Added a custom Weiji (Hexagram 64) icon, with forty-nine points and one empty position.
- Rebranded the project and extension as XiheTradingTerminal (羲和), with an independent extension ID and the renamed GitHub repository.
- Correct the hosted ZigZag deviation input name so the explicit 5% preset is applied.
- Added named chart workspaces and chart-tab renaming, with migration of the original saved tabs.
- Keep chart instances alive when switching tabs/workspaces so in-session indicator adjustments remain intact.
- Include ZigZag (5%, 10) and Simple Moving Average (90) on every new chart; preserve existing additional indicators.
- Apply Gruvbox Dark/Light styling, mist-blue up candles, and wheat-gold down candles.
- Added 6h/8h request options and documented the hosted widget's observed fallback to 1D.
- Adopt Vite 8, Tailwind CSS 4, TypeScript 6, Vitest 5, ESLint 10, and an ES2024/Node.js 22 extension target.
- Add a local VSIX packaging command, offline regression tests and GitHub Actions with VSIX artifacts.
- Stop tracking installed dependencies and generated bundles/packages. Add contributor guidance, context documentation, and updated screenshots.

## [0.0.1] - 2026-02-12

- Initial public release with tabbed sidebar charts, per-tab configuration, workspace persistence, and collapsible settings.

import * as vscode from "vscode";
import { DEFAULT_SYMBOL, LEGACY_STATE_KEY, MAX_INDICATOR_BYTES, normalizeState, STATE_KEY } from "./chartState";
import { WidgetFeed } from "./marketData/widgetFeed";
import { validFeedRequest } from "./marketData/widgetProtocol";
import { diagnosticText, proxyDescription } from "./feedDiagnostics";

export class TradingViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private feed?: WidgetFeed;
  private feedId?: string;

  dispose() { if (this.feedId) { this.log?.info(`[${this.feedId}] Subscription stopped`); } this.feed?.dispose(); this.feed = undefined; this.feedId = undefined; }

  constructor(private readonly extensionUri: vscode.Uri, private readonly workspaceState: vscode.Memento, private readonly log?: Pick<vscode.LogOutputChannel, "info" | "warn" | "error">) {}

  public reload(): void {
    this.dispose();
    if (this.view) { this.view.webview.html = this.getHtml(this.view.webview); }
  }

  public resolveWebviewView(view: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = view;
    this.log?.info("Webview resolved");
    view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    view.webview.html = this.getHtml(view.webview);
    view.onDidDispose?.(() => this.dispose());
    view.onDidChangeVisibility?.(() => {
      this.log?.info(`Webview visible=${view.visible}`);
      if (!view.visible) { this.dispose(); }
      else { void view.webview.postMessage({ type: "previewResume" }); }
    });
    view.webview.onDidReceiveMessage(async message => {
      if (message?.type === "previewSubscribe") {
        const request = validFeedRequest(message);
        if (!request) {
          this.log?.warn("Rejected invalid preview subscription");
          if (typeof message.id === "string") { void view.webview.postMessage({ type: "previewFeed", id: message.id, event: { kind: "status", state: "error", message: "Unsupported preview symbol or timeframe. Use minute intervals, 1D or 1W; complex expressions and other resolutions are unavailable." } }); }
          return;
        }
        if (view.visible === false) { return; }
        this.dispose(); this.feedId = request.id;
        const configuredProxy = vscode.workspace.getConfiguration?.("http").get<string>("proxy");
        const environmentProxy = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"].find(key => process.env[key]);
        const proxy = configuredProxy || (environmentProxy ? process.env[environmentProxy] : undefined);
        this.log?.info(`[${request.id}] Subscribe symbol=${request.symbol} interval=${request.interval} auxiliary=${request.auxiliary.join(",") || "none"} proxySource=${configuredProxy ? "http.proxy" : environmentProxy ?? "none"} proxy=${proxyDescription(proxy)}`);
        this.feed = new WidgetFeed(request, event => {
          if (this.feedId === request.id) {
            if (event.kind === "status") { this.log?.info(`[${request.id}] ${event.state}: ${event.message}`); }
            if (event.kind === "series" && event.reset) { this.log?.info(`[${request.id}] History resolution=${event.resolution} bars=${event.bars.length} source=${event.info.symbol} interval=${event.info.interval} status=${event.info.status}`); }
            void view.webview.postMessage({ type: "previewFeed", id: request.id, event }).then(delivered => {
              if (!delivered && this.feedId === request.id) { this.log?.warn(`[${request.id}] Webview delivery failed`); }
            }, () => { this.log?.warn(`[${request.id}] Webview delivery rejected`); });
          }
        }, { proxy, log: message => this.log?.info(`[${request.id}] ${message}`) });
      } else if (message?.type === "previewDiagnostic" && message.id === this.feedId) {
        if (message.stage === "received" || message.stage === "rendered") {
          const bars = Number.isInteger(message.bars) && message.bars >= 0 && message.bars <= 12_000 ? message.bars : "invalid";
          this.log?.info(`[${this.feedId}] Frontend ${message.stage} resolution=${diagnosticText(message.resolution ?? "main")} bars=${bars}`);
        } else if (message.stage === "renderError") { this.log?.error(`[${this.feedId}] Frontend render error: ${diagnosticText(message.message)}`); }
      } else if (message?.type === "previewInitializationError") {
        this.log?.error(`Frontend initialization error: ${diagnosticText(message.message)}`);
      } else if (message?.type === "previewStop") {
        if (message.id === this.feedId) { this.dispose(); }
      } else if (message?.type === "persist" && message.state) {
        await this.workspaceState.update(STATE_KEY, normalizeState(message.state));
      } else if (message?.type === "confirmRemoveWorkspace" && typeof message.workspaceId === "string") {
        const result = await vscode.window.showWarningMessage(
          `Remove workspace "${String(message.name)}" and its charts?`, { modal: true }, "Remove"
        );
        if (result === "Remove") {
          await view.webview.postMessage({ type: "removeWorkspace", workspaceId: message.workspaceId });
        }
      } else if (message?.type === "loadIndicator" && typeof message.workspaceId === "string" && typeof message.tabId === "string") {
        if (!vscode.workspace.isTrusted) {
          await vscode.window.showWarningMessage("Trust this workspace before loading executable JS indicators.");
          return;
        }
        const files = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { "JavaScript indicator": ["js"] }, openLabel: "Load JS Indicator" });
        if (!files?.[0]) { return; }
        try {
          const bytes = await vscode.workspace.fs.readFile(files[0]);
          if (bytes.byteLength > MAX_INDICATOR_BYTES) { throw new Error("JS indicator files must be 64 KiB or smaller."); }
          const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          await view.webview.postMessage({ type: "indicatorLoaded", workspaceId: message.workspaceId, tabId: message.tabId, name: files[0].path.split("/").at(-1) ?? "Custom JS", source });
        } catch (error) { await vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error)); }
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const initial = normalizeState(this.workspaceState.get(STATE_KEY) ?? this.workspaceState.get(LEGACY_STATE_KEY));
    const state = JSON.stringify(initial).replace(/</g, "\\u003c");
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "out", "webview.js"));
    const styles = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "out", "webview.css"));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>XiheTradingTerminal</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; script-src 'nonce-${nonce}' ${webview.cspSource} https://s3.tradingview.com; style-src ${webview.cspSource}; connect-src 'none'; worker-src blob:; frame-src https://*.tradingview.com;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styles}" />
</head>
<body data-theme="dark">
  <div id="app">
    <div class="workspace-bar">
      <span class="terminal-brand">XIHE</span>
      <label for="workspaceSelect">WORKSPACE</label>
      <select id="workspaceSelect" class="tv-select" aria-label="Workspace"></select>
      <button id="renameWorkspace" class="tv-btn" type="button" title="Rename workspace">Rename</button>
      <button id="addWorkspace" class="tv-btn" type="button">+ Workspace</button>
      <button id="closeWorkspace" class="tv-btn" type="button" title="Remove workspace">Remove</button>
    </div>
    <div class="comparison-heading">
      <span>TRADINGVIEW + INDICATOR PREVIEW</span>
      <span id="followStatus" role="status">Following saved symbol and interval</span>
    </div>
    <div class="control-bar">
      <div class="tabs" id="tabs" aria-label="Chart tabs"></div>
      <div class="top-actions">
        <button class="tv-btn" id="toggleSettings" aria-expanded="${!initial.ui.isToolbarCollapsed}" type="button">${initial.ui.isToolbarCollapsed ? "Show Settings" : "Hide Settings"}</button>
        <button class="tv-btn" id="addTab" type="button">+ Chart</button>
        <span class="status-pill" id="status">Workspace synced</span>
      </div>
    </div>
    <div class="toolbar${initial.ui.isToolbarCollapsed ? " collapsed" : ""}" id="toolbar" aria-label="Chart settings"${initial.ui.isToolbarCollapsed ? " inert" : ""}>
      <div class="stack">
        <label for="symbolInput">Symbol (exchange:ticker)</label>
        <input id="symbolInput" class="tv-input" placeholder="${DEFAULT_SYMBOL}" autocomplete="off" />
      </div>
      <div class="stack">
        <label for="intervalSelect">Interval</label>
        <select id="intervalSelect" class="tv-select">
          <option value="1">1m</option><option value="5">5m</option>
          <option value="15">15m</option><option value="30">30m</option>
          <option value="60">1h</option><option value="240">4h</option>
          <option value="360">6h</option><option value="480">8h</option>
          <option value="D">1D</option><option value="W">1W</option>
        </select>
      </div>
      <div class="stack">
        <label id="studiesLabel" for="studiesInput">Additional indicators (comma list)</label>
        <input id="studiesInput" class="tv-input" placeholder="RSI@tv-basicstudies" />
      </div>
      <div class="stack">
        <label>Theme</label>
        <div class="segmented" id="themeToggle">
          <button data-theme="dark" class="active" type="button">Gruvbox Dark</button>
          <button data-theme="light" type="button">Gruvbox Light</button>
        </div>
      </div>
    </div>
    <div class="chart-caption">
      <span>ZigZag (5%, 10) · MA (90)</span><span class="direction-key">Blue ↑ / Gold ↓</span>
      <button id="retryChart" class="chart-retry" type="button" title="Reconnect the indicator preview. The main chart stays open.">Reconnect Preview</button>
      <button id="reloadWidget" class="chart-retry" type="button" title="Recreate the main chart. Unsaved edits inside it will be lost.">Reload Main Chart</button>
    </div>
    <div id="chartNotice" class="chart-notice" role="status" hidden></div>
    <div id="localTools" class="local-tools">
      <div id="builtinPicker" class="builtin-picker">
        <button id="builtinToggle" class="tv-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="builtinDropdown">Built-in Indicators <span id="builtinCount"></span> ▾</button>
        <div id="builtinDropdown" class="builtin-dropdown" role="dialog" aria-label="Built-in indicators" hidden>
          <div class="builtin-search-row">
            <input id="builtinSearch" class="tv-input" type="search" placeholder="Search indicators…" aria-label="Search built-in indicators" aria-controls="builtinOptions" autocomplete="off" />
            <button id="builtinClose" class="builtin-close" type="button" aria-label="Close indicators">×</button>
          </div>
          <p class="builtin-required">Always on: ZigZag (5%, 10) · MA (90)</p>
          <div id="builtinOptions" class="builtin-options"></div>
          <p id="builtinEmpty" class="builtin-empty" hidden>No matching indicators.</p>
          <p id="builtinResults" class="builtin-required" role="status"></p>
        </div>
      </div>
      <button id="loadIndicator" class="tv-btn" type="button">Load JS Indicator</button>
      <span id="customIndicators" class="indicator-list"></span>
      <span class="local-help">Preview indicators · Widget market data · JavaScript, no Pine Script</span>
      <div id="builtinSelected" class="builtin-selected"></div>
    </div>
    <div id="intervalWarning" class="interval-warning" role="status" hidden>TradingView may fall back to 1D for 6h / 8h. Check the interval inside the chart.</div>
    <div class="comparison-charts">
      <section class="chart-panel" aria-label="TradingView main chart">
        <div class="panel-heading"><strong>TradingView · Main</strong><span>Hosted chart &amp; drawing tools</span></div>
        <div class="chart-shell"><div id="container"></div></div>
      </section>
      <section class="chart-panel" aria-label="Local indicator preview">
        <div class="panel-heading"><strong>Lightweight · Indicator Preview</strong><span>Same Widget feed · local calculations</span></div>
        <div id="previewNotice" class="chart-notice" role="status" hidden></div>
        <div class="chart-shell"><div id="previewContainer"></div></div>
      </section>
    </div>
  </div>
  <div id="renameDialog" class="rename-overlay" role="dialog" aria-modal="true" aria-labelledby="renameTitle" hidden>
    <form id="renameForm" class="rename-card">
      <label id="renameTitle" for="renameInput">Rename</label>
      <input id="renameInput" class="tv-input" maxlength="80" required autocomplete="off" />
      <div class="rename-actions"><button id="cancelRename" class="tv-btn" type="button">Cancel</button><button class="tv-btn" type="submit">Save</button></div>
    </form>
  </div>
  <script nonce="${nonce}" type="application/json" id="initialState">${state}</script>
  <script nonce="${nonce}" type="application/json" id="runtimeConfig">${JSON.stringify({ trusted: vscode.workspace.isTrusted }).replace(/</g, "\\u003c")}</script>
  <script nonce="${nonce}" src="${script}" defer></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

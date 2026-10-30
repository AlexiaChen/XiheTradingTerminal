import * as vscode from "vscode";
import { DEFAULT_SYMBOL, LEGACY_STATE_KEY, normalizeState, STATE_KEY } from "./chartState";

export class TradingViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri, private readonly workspaceState: vscode.Memento) {}

  public reload(): void {
    if (this.view) { this.view.webview.html = this.getHtml(this.view.webview); }
  }

  public resolveWebviewView(view: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
    view.webview.html = this.getHtml(view.webview);
    view.webview.onDidReceiveMessage(async message => {
      if (message?.type === "persist" && message.state) {
        await this.workspaceState.update(STATE_KEY, normalizeState(message.state));
      } else if (message?.type === "confirmRemoveWorkspace" && typeof message.workspaceId === "string") {
        const result = await vscode.window.showWarningMessage(
          `Remove workspace "${String(message.name)}" and its charts?`, { modal: true }, "Remove"
        );
        if (result === "Remove") {
          await view.webview.postMessage({ type: "removeWorkspace", workspaceId: message.workspaceId });
        }
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; script-src 'nonce-${nonce}' ${webview.cspSource} https://s3.tradingview.com; style-src ${webview.cspSource}; frame-src https://*.tradingview.com;" />
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
        <label for="studiesInput">Additional indicators (comma list)</label>
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
    </div>
    <div id="intervalWarning" class="interval-warning" role="status" hidden>TradingView may fall back to 1D for 6h / 8h. Check the interval inside the chart.</div>
    <div class="chart-shell"><div id="container"></div></div>
  </div>
  <div id="renameDialog" class="rename-overlay" role="dialog" aria-modal="true" aria-labelledby="renameTitle" hidden>
    <form id="renameForm" class="rename-card">
      <label id="renameTitle" for="renameInput">Rename</label>
      <input id="renameInput" class="tv-input" maxlength="80" required autocomplete="off" />
      <div class="rename-actions"><button id="cancelRename" class="tv-btn" type="button">Cancel</button><button class="tv-btn" type="submit">Save</button></div>
    </form>
  </div>
  <script nonce="${nonce}" type="application/json" id="initialState">${state}</script>
  <script nonce="${nonce}" src="https://s3.tradingview.com/tv.js"></script>
  <script nonce="${nonce}" src="${script}" defer></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

import * as vscode from "vscode";

type Theme = "dark" | "light";

type ChartTab = {
  id: string;
  name: string;
  symbol: string;
  interval: string;
  studies: string[];
  theme: Theme;
  timezone: string;
};

type TradingViewUiState = {
  isToolbarCollapsed: boolean;
};

type TradingViewState = {
  tabs: ChartTab[];
  activeTabId: string;
  ui: TradingViewUiState;
};

const STATE_KEY = "tradingview.state";

export class TradingViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  private readonly defaultState: TradingViewState = {
    tabs: [
      {
        id: "tab-1",
        name: "Main",
        symbol: "BINANCE:SOLUSDT",
        interval: "15",
        studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
        theme: "dark",
        timezone: "Etc/UTC"
      }
    ],
    activeTabId: "tab-1",
    ui: {
      isToolbarCollapsed: false
    }
  };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly workspaceState: vscode.Memento
  ) {}

  public reload(): void {
    if (!this._view) {
      return;
    }

    this._view.webview.html = this.getHtml(this._view.webview);
  }

  /**
   * Called by VS Code when the view is first shown.
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === "persist" && message.state) {
        const sanitized = this.sanitizeState(message.state);
        await this.workspaceState.update(STATE_KEY, sanitized);
      }
    });
  }

  /**
   * HTML for the TradingView widget.
   */
  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const initialState = this.getInitialState();
    const serializedState = JSON.stringify(initialState).replace(/</g, "\\u003c");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="
      default-src 'none';
      img-src https: data:;
      script-src 'nonce-${nonce}' https://s3.tradingview.com;
      style-src 'unsafe-inline';
      frame-src https://*.tradingview.com;
    "
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    :root {
      color-scheme: dark;
      --tv-bg: #0F0F0F;
      --tv-surface: #0F0F0F;
      --tv-surface-2: #2a2e39;
      --tv-border: #2E2E2E;
      --tv-text: #d1d4dc;
      --tv-muted: #787b86;
      --tv-accent: #2962ff;
      --tv-accent-hover: #1e53e5;
      --tv-danger: #f23645;
      --tv-input: #2E2E2E;
      --tv-chart-border: #2a2e39;
    }

    [data-theme="light"] {
      color-scheme: light;
      --tv-bg: #f0f3fa;
      --tv-surface: #ffffff;
      --tv-surface-2: #f8f9fd;
      --tv-border: #dce0ea;
      --tv-text: #131722;
      --tv-muted: #6a6d78;
      --tv-accent: #2962ff;
      --tv-accent-hover: #1e53e5;
      --tv-danger: #e04352;
      --tv-input: #ffffff;
      --tv-chart-border: #dce0ea;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: var(--tv-bg);
      color: var(--tv-text);
      font-family: -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }

    #app {
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      background: var(--tv-bg);
    }

    .control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 36px;
    }

    .tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }

    .tabs::-webkit-scrollbar {
      height: 6px;
    }

    .tabs::-webkit-scrollbar-thumb {
      background: var(--tv-border);
      border-radius: 999px;
    }

    .tab {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--tv-border);
      border-radius: 8px;
      background: var(--tv-surface);
      min-width: 0;
      flex-shrink: 0;
    }

    .tab.active {
      border-color: var(--tv-accent);
      background: rgba(41, 98, 255, 0.15);
    }

    .tab-switch {
      border: 0;
      background: transparent;
      color: var(--tv-text);
      padding: 6px 9px;
      cursor: pointer;
      font: inherit;
      white-space: nowrap;
    }

    .tab-switch:hover {
      color: var(--tv-accent);
    }

    .tab-close {
      border: 0;
      border-left: 1px solid var(--tv-border);
      background: transparent;
      color: var(--tv-muted);
      padding: 6px 7px;
      cursor: pointer;
      font: inherit;
      line-height: 1;
    }

    .tab-close:hover {
      color: var(--tv-danger);
    }

    .top-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .tv-btn {
      border: 1px solid var(--tv-border);
      background: var(--tv-surface);
      color: var(--tv-text);
      border-radius: 8px;
      padding: 6px 10px;
      font: inherit;
      cursor: pointer;
      transition: border-color 120ms ease, background-color 120ms ease;
    }

    .tv-btn:hover {
      border-color: var(--tv-accent);
    }

    .tv-btn:focus-visible,
    .tv-input:focus,
    .tv-select:focus {
      outline: none;
      border-color: var(--tv-accent);
      box-shadow: 0 0 0 1px rgba(41, 98, 255, 0.45);
    }

    .status-pill {
      border: 1px solid var(--tv-border);
      border-radius: 999px;
      padding: 5px 9px;
      color: var(--tv-muted);
      white-space: nowrap;
    }

    .toolbar {
      border: 1px solid var(--tv-border);
      border-radius: 10px;
      background: var(--tv-surface);
      display: grid;
      grid-template-columns: repeat(4, minmax(130px, 1fr));
      gap: 10px;
      padding: 10px;
      max-height: 280px;
      opacity: 1;
      transform: translateY(0);
      transition: max-height 180ms ease, opacity 140ms ease, transform 140ms ease, padding 180ms ease, border-width 180ms ease;
      overflow: hidden;
    }

    .toolbar.collapsed {
      max-height: 0;
      opacity: 0;
      transform: translateY(-4px);
      padding-top: 0;
      padding-bottom: 0;
      border-width: 0;
      margin: 0;
      pointer-events: none;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .stack label {
      font-size: 11px;
      color: var(--tv-muted);
    }

    .tv-input,
    .tv-select {
      width: 100%;
      border: 1px solid var(--tv-border);
      border-radius: 7px;
      background: var(--tv-input);
      color: var(--tv-text);
      font: inherit;
      padding: 8px 9px;
      min-height: 32px;
    }

    .segmented {
      display: inline-flex;
      border: 1px solid var(--tv-border);
      border-radius: 8px;
      overflow: hidden;
      min-height: 32px;
    }

    .segmented button {
      border: 0;
      background: var(--tv-surface-2);
      color: var(--tv-text);
      padding: 0 10px;
      font: inherit;
      cursor: pointer;
      min-width: 56px;
      flex-grow: 1
    }

    .segmented button + button {
      border-left: 1px solid var(--tv-border);
    }

    .segmented button.active {
      background: var(--tv-accent);
      color: #ffffff;
    }

    .chart-shell {
      flex: 1;
      min-height: 220px;
      border: 1px solid var(--tv-chart-border);
      border-radius: 10px;
      overflow: hidden;
      background: var(--tv-surface);
    }

    #container {
      width: 100%;
      height: 100%;
    }

    @media (max-width: 900px) {
      .toolbar {
        grid-template-columns: repeat(2, minmax(140px, 1fr));
      }
    }

    @media (max-width: 700px) {
      #app {
        padding: 8px;
      }



      .toolbar {
        grid-template-columns: 1fr;
      }

      .status-pill {
        display: none;
      }
    }
  </style>
</head>

<body data-theme="dark">
  <div id="app">
    <div class="control-bar">
      <div class="tabs" id="tabs" aria-label="Chart tabs"></div>
      <div class="top-actions">
        <button class="tv-btn" id="toggleSettings" aria-expanded="true" type="button">Hide Settings</button>
        <button class="tv-btn" id="addTab" type="button">+ Chart</button>
        <span class="status-pill" id="status">Workspace synced</span>
      </div>
    </div>

    <div class="toolbar" id="toolbar" aria-label="Chart settings">
      <div class="stack">
        <label for="symbolInput">Symbol (exchange:ticker)</label>
        <input id="symbolInput" class="tv-input" placeholder="BINANCE:SOLUSDT" autocomplete="off" />
      </div>
      <div class="stack">
        <label for="intervalSelect">Interval</label>
        <select id="intervalSelect" class="tv-select">
          <option value="1">1m</option>
          <option value="5">5m</option>
          <option value="15" selected>15m</option>
          <option value="30">30m</option>
          <option value="60">1h</option>
          <option value="240">4h</option>
          <option value="D">1D</option>
          <option value="W">1W</option>
        </select>
      </div>
      <div class="stack">
        <label for="studiesInput">Indicators (comma list)</label>
        <input id="studiesInput" class="tv-input" placeholder="Volume@tv-basicstudies, RSI@tv-basicstudies" />
      </div>
      <div class="stack">
        <label>Theme</label>
        <div class="segmented" id="themeToggle">
          <button data-theme="dark" class="active" type="button">Dark</button>
          <button data-theme="light" type="button">Light</button>
        </div>
      </div>
    </div>

    <div class="chart-shell">
      <div id="container"></div>
    </div>
  </div>

  <script nonce="${nonce}" src="https://s3.tradingview.com/tv.js"></script>
  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      const initialState = ${serializedState};
      const restoredState = vscode.getState();
      let state = validateState(restoredState || initialState);
      vscode.setState(state);

      const tabsEl = document.getElementById("tabs");
      const addTabBtn = document.getElementById("addTab");
      const toggleSettingsBtn = document.getElementById("toggleSettings");
      const toolbarEl = document.getElementById("toolbar");
      const symbolInput = document.getElementById("symbolInput");
      const intervalSelect = document.getElementById("intervalSelect");
      const studiesInput = document.getElementById("studiesInput");
      const themeToggle = document.getElementById("themeToggle");
      const statusPill = document.getElementById("status");
      const container = document.getElementById("container");

      let widget = null;
      let pendingPersistTimer = null;

      function validateState(raw) {
        if (!raw || !Array.isArray(raw.tabs) || raw.tabs.length === 0) {
          return getDefaultState();
        }

        const tabs = raw.tabs
          .map(function(tab) { return normalizeTab(tab); })
          .filter(Boolean);

        if (tabs.length === 0) {
          return getDefaultState();
        }

        const activeTabId = tabs.some(function(tab) { return tab.id === raw.activeTabId; })
          ? raw.activeTabId
          : tabs[0].id;

        return {
          tabs: tabs,
          activeTabId: activeTabId,
          ui: normalizeUi(raw.ui)
        };
      }

      function normalizeUi(rawUi) {
        return {
          isToolbarCollapsed: !!(rawUi && rawUi.isToolbarCollapsed)
        };
      }

      function normalizeTab(tab) {
        if (!tab || typeof tab !== "object") {
          return null;
        }

        const randomId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "tab-" + Date.now();

        const id = typeof tab.id === "string" ? tab.id : randomId;
        const name = typeof tab.name === "string" && tab.name.trim().length > 0 ? tab.name.trim() : "Chart";
        const symbol = typeof tab.symbol === "string" && tab.symbol.trim().length > 0 ? tab.symbol.trim().toUpperCase() : "BINANCE:SOLUSDT";
        const interval = typeof tab.interval === "string" || typeof tab.interval === "number"
          ? String(tab.interval)
          : "15";
        const studies = Array.isArray(tab.studies)
          ? tab.studies.filter(function(value) { return typeof value === "string" && value.trim().length > 0; })
          : ["Volume@tv-basicstudies", "RSI@tv-basicstudies"];
        const theme = tab.theme === "light" ? "light" : "dark";
        const timezone = typeof tab.timezone === "string" ? tab.timezone : "Etc/UTC";

        return { id: id, name: name, symbol: symbol, interval: interval, studies: studies, theme: theme, timezone: timezone };
      }

      function getDefaultState() {
        return {
          tabs: [{
            id: "tab-1",
            name: "Main",
            symbol: "BINANCE:SOLUSDT",
            interval: "15",
            studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
            theme: "dark",
            timezone: "Etc/UTC"
          }],
          activeTabId: "tab-1",
          ui: {
            isToolbarCollapsed: false
          }
        };
      }

      function getActiveTab() {
        return state.tabs.find(function(tab) { return tab.id === state.activeTabId; }) || state.tabs[0];
      }

      function persistState() {
        vscode.setState(state);
        vscode.postMessage({ type: "persist", state: state });
        if (statusPill) {
          statusPill.textContent = "Saved to workspace";
        }
      }

      function schedulePersistState() {
        if (pendingPersistTimer) {
          clearTimeout(pendingPersistTimer);
        }

        pendingPersistTimer = setTimeout(function() {
          pendingPersistTimer = null;
          persistState();
        }, 120);
      }

      function flushPendingPersist() {
        if (!pendingPersistTimer) {
          return;
        }

        clearTimeout(pendingPersistTimer);
        pendingPersistTimer = null;
        persistState();
      }

      function renderTabs() {
        if (!tabsEl) {
          return;
        }

        tabsEl.innerHTML = "";

        state.tabs.forEach(function(tab) {
          const wrapper = document.createElement("div");
          wrapper.className = "tab" + (tab.id === state.activeTabId ? " active" : "");

          const switchBtn = document.createElement("button");
          switchBtn.type = "button";
          switchBtn.className = "tab-switch";
          switchBtn.title = "Switch to " + tab.name;
          switchBtn.textContent = tab.name;
          switchBtn.addEventListener("click", function() {
            setActiveTab(tab.id);
          });

          const closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.className = "tab-close";
          closeBtn.setAttribute("aria-label", "Close " + tab.name);
          closeBtn.textContent = "x";
          closeBtn.addEventListener("click", function() {
            closeTab(tab.id);
          });

          wrapper.appendChild(switchBtn);
          wrapper.appendChild(closeBtn);
          tabsEl.appendChild(wrapper);
        });
      }

      function closeTab(id) {
        if (state.tabs.length === 1) {
          return;
        }

        const filtered = state.tabs.filter(function(tab) { return tab.id !== id; });
        state.tabs = filtered;

        if (!filtered.some(function(tab) { return tab.id === state.activeTabId; })) {
          state.activeTabId = filtered[0].id;
        }

        persistState();
        renderTabs();
        syncInputs();
        renderChart();
      }

      function setActiveTab(id) {
        if (state.activeTabId === id) {
          return;
        }

        state.activeTabId = id;
        persistState();
        renderTabs();
        syncInputs();
        renderChart();
      }

      function addTab() {
        const base = getActiveTab() || getDefaultState().tabs[0];
        const newTab = {
          id: "tab-" + Date.now(),
          name: "Chart " + (state.tabs.length + 1),
          symbol: base.symbol,
          interval: base.interval,
          studies: Array.isArray(base.studies) ? base.studies.slice() : [],
          theme: base.theme,
          timezone: base.timezone
        };

        state.tabs.push(newTab);
        state.activeTabId = newTab.id;

        renderTabs();
        syncInputs();
        renderChart();
        persistState();
      }

      function applyToolbarState() {
        if (!toolbarEl || !toggleSettingsBtn) {
          return;
        }

        const isCollapsed = !!state.ui.isToolbarCollapsed;
        toolbarEl.classList.toggle("collapsed", isCollapsed);
        toggleSettingsBtn.textContent = isCollapsed ? "Show Settings" : "Hide Settings";
        toggleSettingsBtn.setAttribute("aria-expanded", String(!isCollapsed));
      }

      function syncInputs() {
        const tab = getActiveTab();
        if (!tab) {
          return;
        }

        document.body.setAttribute("data-theme", tab.theme);

        if (symbolInput) {
          symbolInput.value = tab.symbol;
        }

        if (intervalSelect) {
          intervalSelect.value = tab.interval;
        }

        if (studiesInput) {
          studiesInput.value = tab.studies.join(", ");
        }

        if (themeToggle) {
          Array.from(themeToggle.querySelectorAll("button")).forEach(function(button) {
            const isActive = button.dataset.theme === tab.theme;
            button.classList.toggle("active", isActive);
          });
        }

        applyToolbarState();
      }

      function updateActiveTab(mutator, options) {
        const tab = getActiveTab();
        if (!tab) {
          return;
        }

        mutator(tab);
        persistState();
        syncInputs();

        const shouldRefreshChart = options && Object.prototype.hasOwnProperty.call(options, "refreshChart")
          ? !!options.refreshChart
          : true;

        if (shouldRefreshChart) {
          renderChart();
        }
      }

      function parseStudiesInput(raw) {
        return String(raw || "")
          .split(",")
          .map(function(value) { return value.trim(); })
          .filter(function(value) { return value.length > 0; });
      }

      function renderChart() {
        const tab = getActiveTab();
        if (!tab || !container) {
          return;
        }

        if (widget && typeof widget.remove === "function") {
          widget.remove();
        }

        container.innerHTML = "";

        if (!window.TradingView || !window.TradingView.widget) {
          console.warn("TradingView library not ready yet");
          return;
        }

        widget = new window.TradingView.widget({
          container_id: "container",
          autosize: true,
          symbol: tab.symbol,
          interval: tab.interval,
          timezone: tab.timezone,
          theme: tab.theme,
          style: "1",
          locale: "en",
          toolbar_bg: tab.theme === "dark" ? "#1e222d" : "#f0f3fa",
          hide_side_toolbar: false,
          allow_symbol_change: true,
          studies: tab.studies
        });
      }

      if (addTabBtn) {
        addTabBtn.addEventListener("click", addTab);
      }

      if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener("click", function() {
          state.ui.isToolbarCollapsed = !state.ui.isToolbarCollapsed;
          applyToolbarState();
          persistState();
        });
      }

      if (symbolInput) {
        symbolInput.addEventListener("input", function() {
          const tab = getActiveTab();
          if (!tab) {
            return;
          }

          tab.symbol = symbolInput.value.trim().toUpperCase() || "BINANCE:SOLUSDT";
          schedulePersistState();
        });

        symbolInput.addEventListener("change", function() {
          const value = symbolInput.value.trim().toUpperCase() || "BINANCE:SOLUSDT";
          updateActiveTab(function(tab) {
            tab.symbol = value;
          });
        });
      }

      if (intervalSelect) {
        intervalSelect.addEventListener("change", function() {
          const value = intervalSelect.value;
          updateActiveTab(function(tab) {
            tab.interval = value;
          });
        });
      }

      if (studiesInput) {
        studiesInput.addEventListener("input", function() {
          const tab = getActiveTab();
          if (!tab) {
            return;
          }

          tab.studies = parseStudiesInput(studiesInput.value);
          schedulePersistState();
        });

        studiesInput.addEventListener("change", function() {
          const studies = parseStudiesInput(studiesInput.value);

          updateActiveTab(function(tab) {
            tab.studies = studies;
          });
        });
      }

      if (themeToggle) {
        themeToggle.querySelectorAll("button").forEach(function(button) {
          button.addEventListener("click", function() {
            const theme = button.dataset.theme === "light" ? "light" : "dark";
            updateActiveTab(function(tab) {
              tab.theme = theme;
            }, { refreshChart: true });
          });
        });
      }

      document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
          flushPendingPersist();
        }
      });

      window.addEventListener("beforeunload", flushPendingPersist);

      renderTabs();
      syncInputs();
      renderChart();
    })();
  </script>
</body>
</html>`;
  }

  private getInitialState(): TradingViewState {
    const persisted = this.workspaceState.get<TradingViewState>(STATE_KEY);
    return this.sanitizeState(persisted);
  }

  private sanitizeState(raw: unknown): TradingViewState {
    if (!raw || typeof raw !== "object") {
      return this.defaultState;
    }

    const candidate = raw as Partial<TradingViewState>;
    const tabs = Array.isArray(candidate.tabs)
      ? candidate.tabs
          .map((tab) => this.normalizeTab(tab))
          .filter((tab): tab is ChartTab => !!tab)
      : [];

    if (tabs.length === 0) {
      return this.defaultState;
    }

    const activeTabId = tabs.some((tab) => tab.id === candidate.activeTabId)
      ? candidate.activeTabId
      : tabs[0].id;

    return {
      tabs,
      activeTabId: activeTabId ?? tabs[0].id,
      ui: this.normalizeUi(candidate.ui)
    };
  }

  private normalizeUi(ui: unknown): TradingViewUiState {
    if (!ui || typeof ui !== "object") {
      return {
        isToolbarCollapsed: false
      };
    }

    const candidate = ui as Partial<TradingViewUiState>;
    return {
      isToolbarCollapsed: candidate.isToolbarCollapsed === true
    };
  }

  private normalizeTab(tab: unknown): ChartTab | null {
    if (!tab || typeof tab !== "object") {
      return null;
    }

    const t = tab as Partial<ChartTab>;
    const id = typeof t.id === "string" ? t.id : `tab-${Date.now()}`;
    const name = typeof t.name === "string" ? t.name : "Chart";
    const symbol =
      typeof t.symbol === "string" && t.symbol.length > 0
        ? t.symbol
        : "BINANCE:SOLUSDT";
    const interval =
      typeof t.interval === "string" || typeof t.interval === "number"
        ? String(t.interval)
        : "15";
    const studies = Array.isArray(t.studies)
      ? t.studies.filter((study): study is string => typeof study === "string")
      : ["Volume@tv-basicstudies", "RSI@tv-basicstudies"];
    const theme: Theme = t.theme === "light" ? "light" : "dark";
    const timezone = typeof t.timezone === "string" ? t.timezone : "Etc/UTC";

    return { id, name, symbol, interval, studies, theme, timezone };
  }
}

/**
 * Utility to generate a nonce for CSP.
 */
function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

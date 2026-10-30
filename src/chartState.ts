export type Theme = "dark" | "light";
export type ChartTab = {
  id: string;
  name: string;
  symbol: string;
  interval: string;
  studies: string[];
  theme: Theme;
  timezone: string;
};
export type ChartWorkspace = { id: string; name: string; tabs: ChartTab[]; activeTabId: string };
export type TradingViewState = {
  workspaces: ChartWorkspace[];
  activeWorkspaceId: string;
  ui: { isToolbarCollapsed: boolean };
};

export const STATE_KEY = "xihe-trading-terminal.state";
export const LEGACY_STATE_KEY = "tradingview.state";
export const DEFAULT_SYMBOL = "BINANCE:ETHUSDT";
export const DEFAULT_INTERVAL = "240";
export const REQUIRED_STUDIES = ["ZigZag@tv-basicstudies", "MASimple@tv-basicstudies"];

export function normalizeStudies(raw: unknown): string[] {
  const additional = Array.isArray(raw) ? raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map(value => value.trim()) : [];
  return [...new Set([...REQUIRED_STUDIES, ...additional])];
}

export function createTab(id: string, name = "Main"): ChartTab {
  return { id, name, symbol: DEFAULT_SYMBOL, interval: DEFAULT_INTERVAL, studies: [...REQUIRED_STUDIES], theme: "dark", timezone: "Etc/UTC" };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function uniqueId(value: unknown, fallback: string, used: Set<string>): string {
  const base = text(value, fallback);
  let id = base;
  let suffix = 1;
  while (used.has(id)) { id = `${base}-${suffix++}`; }
  used.add(id);
  return id;
}

/** Shared by the extension host and Webview, including migration of the original tabs-only state. */
export function normalizeState(raw: unknown): TradingViewState {
  const candidate = record(raw);
  const rawWorkspaces = Array.isArray(candidate.workspaces) && candidate.workspaces.length ? candidate.workspaces : [{ id: "workspace-1", name: "Workspace 1", tabs: candidate.tabs, activeTabId: candidate.activeTabId }];
  const workspaceIds = new Set<string>();
  const workspaces = rawWorkspaces.filter(value => value !== null && typeof value === "object").map((value, index) => {
    const workspace = record(value);
    const tabIds = new Set<string>();
    const tabs = (Array.isArray(workspace.tabs) ? workspace.tabs : []).filter(value => value !== null && typeof value === "object").map((value, tabIndex): ChartTab => {
      const tab = record(value);
      return {
        id: uniqueId(tab.id, `tab-${tabIndex + 1}`, tabIds),
        name: text(tab.name, tabIndex === 0 ? "Main" : `Chart ${tabIndex + 1}`),
        symbol: text(tab.symbol, DEFAULT_SYMBOL).toUpperCase(),
        interval: typeof tab.interval === "string" || typeof tab.interval === "number" ? String(tab.interval) : DEFAULT_INTERVAL,
        studies: normalizeStudies(tab.studies),
        theme: tab.theme === "light" ? "light" : "dark",
        timezone: text(tab.timezone, "Etc/UTC")
      };
    });
    if (!tabs.length) { tabs.push(createTab("tab-1")); }
    return {
      id: uniqueId(workspace.id, `workspace-${index + 1}`, workspaceIds),
      name: text(workspace.name, `Workspace ${index + 1}`),
      tabs,
      activeTabId: tabs.some(tab => tab.id === workspace.activeTabId) ? workspace.activeTabId as string : tabs[0].id
    };
  });
  if (!workspaces.length) { return normalizeState(undefined); }
  const collapsed = record(candidate.ui).isToolbarCollapsed;
  return {
    workspaces,
    activeWorkspaceId: workspaces.some(workspace => workspace.id === candidate.activeWorkspaceId) ? candidate.activeWorkspaceId as string : workspaces[0].id,
    ui: { isToolbarCollapsed: typeof collapsed === "boolean" ? collapsed : true }
  };
}

export function activeWorkspace(state: TradingViewState): ChartWorkspace {
  return state.workspaces.find(workspace => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0];
}

export function activeTab(state: TradingViewState): ChartTab {
  const workspace = activeWorkspace(state);
  return workspace.tabs.find(tab => tab.id === workspace.activeTabId) ?? workspace.tabs[0];
}

import { activeTab, activeWorkspace, createTab, DEFAULT_SYMBOL, MAX_INDICATORS, normalizeCustomIndicators, normalizeState, normalizeStudies, REQUIRED_STUDIES } from "../chartState";
import type { TradingViewState } from "../chartState";
import { widgetOptions } from "../theme";
import { ChartCache } from "./chartCache";
import { createWidgetLoader } from "./widgetLoader";
import { createLightweightChart } from "./lightweightChart";
import "./styles.css";

declare function acquireVsCodeApi(): {
  getState(): unknown;
  setState(state: TradingViewState): void;
  postMessage(message: unknown): void;
}
declare global {
  interface Window {
    TradingView?: { widget: new (options: ReturnType<typeof widgetOptions>) => { remove?: () => void } };
  }
}

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) { throw new Error(`Missing element: ${id}`); }
  return node as T;
}

const vscode = acquireVsCodeApi();
const initial = JSON.parse(element("initialState").textContent || "null");
const state = normalizeState(vscode.getState() ?? initial);
const runtime = JSON.parse(element("runtimeConfig").textContent || "{}");
const workspaceSelect = element<HTMLSelectElement>("workspaceSelect");
const tabsEl = element("tabs");
const symbolInput = element<HTMLInputElement>("symbolInput");
const intervalSelect = element<HTMLSelectElement>("intervalSelect");
const studiesInput = element<HTMLInputElement>("studiesInput");
const renameDialog = element("renameDialog");
const renameInput = element<HTMLInputElement>("renameInput");
let renameTarget: { kind: "workspace" | "chart"; workspaceId: string; tabId?: string } | undefined;
let previousFocus: HTMLElement | null = null;
const cache = new ChartCache(element("container"), (tab, id) => {
  if (tab.engine === "lightweight") { return createLightweightChart(tab, id, runtime.trusted === true); }
  if (!window.TradingView?.widget) { throw new Error("TradingView could not load. Check your network and reload the sidebar."); }
  return new window.TradingView.widget(widgetOptions(tab, id));
});
const loadWidget = createWidgetLoader(document, () => Boolean(window.TradingView?.widget), element<HTMLScriptElement>("initialState").nonce);
let chartRequest = 0;

function chartNotice(message: string) {
  element("chartNotice").textContent = message;
  element("chartNotice").hidden = !message;
}

function showChart(retry = false) {
  const request = ++chartRequest;
  const show = () => {
    if (request !== chartRequest) { return; }
    const workspace = activeWorkspace(state);
    try {
      if (retry) { cache.retry(workspace.id, activeTab(state)); }
      else { cache.show(workspace.id, activeTab(state)); }
      chartNotice("");
    } catch (error) { chartNotice(error instanceof Error ? error.message : String(error)); }
  };
  // Cached charts switch synchronously and retain their internal indicator edits.
  if (activeTab(state).engine === "lightweight" || window.TradingView?.widget) { show(); return; }
  chartNotice("Connecting to TradingView…");
  void loadWidget().then(show, error => {
    if (request === chartRequest) { chartNotice(error instanceof Error ? error.message : String(error)); }
  });
}

function persist() {
  vscode.setState(state);
  vscode.postMessage({ type: "persist", state });
  element("status").textContent = "Saved to workspace";
}

function button(label: string, className: string, action: () => void) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  node.addEventListener("click", action);
  return node;
}

function newId(): string {
  if (typeof crypto.randomUUID === "function") { return crypto.randomUUID(); }
  // randomUUID requires a secure origin; getRandomValues also works in standalone previews.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
}

function render() {
  const workspace = activeWorkspace(state);
  const tab = activeTab(state);
  document.body.dataset.theme = tab.theme;
  workspaceSelect.replaceChildren(...state.workspaces.map(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    return option;
  }));
  workspaceSelect.value = workspace.id;
  element<HTMLButtonElement>("closeWorkspace").disabled = state.workspaces.length === 1;
  tabsEl.replaceChildren(...workspace.tabs.map(item => {
    const wrapper = document.createElement("div");
    wrapper.className = `tab${item.id === workspace.activeTabId ? " active" : ""}`;
    const switchButton = button(item.name, "tab-switch", () => {
      workspace.activeTabId = item.id;
      persist(); render();
    });
    switchButton.addEventListener("dblclick", () => openRename("chart", item.id));
    const renameButton = button("✎", "tab-rename", () => openRename("chart", item.id));
    renameButton.setAttribute("aria-label", `Rename ${item.name}`);
    renameButton.title = `Rename ${item.name}`;
    const closeButton = button("×", "tab-close", () => {
      if (workspace.tabs.length === 1) { return; }
      workspace.tabs = workspace.tabs.filter(value => value.id !== item.id);
      if (workspace.activeTabId === item.id) { workspace.activeTabId = workspace.tabs[0].id; }
      persist(); render();
    });
    closeButton.setAttribute("aria-label", `Close ${item.name}`);
    closeButton.disabled = workspace.tabs.length === 1;
    wrapper.append(switchButton, renameButton, closeButton);
    return wrapper;
  }));
  symbolInput.value = tab.symbol;
  intervalSelect.value = tab.interval;
  studiesInput.value = tab.studies.filter(study => !REQUIRED_STUDIES.includes(study)).join(", ");
  for (const node of element("themeToggle").querySelectorAll<HTMLButtonElement>("button")) {
    node.classList.toggle("active", node.dataset.theme === tab.theme);
  }
  element("toolbar").classList.toggle("collapsed", state.ui.isToolbarCollapsed);
  element("toolbar").inert = state.ui.isToolbarCollapsed;
  const toggle = element("toggleSettings");
  toggle.textContent = state.ui.isToolbarCollapsed ? "Show Settings" : "Hide Settings";
  toggle.setAttribute("aria-expanded", String(!state.ui.isToolbarCollapsed));
  element("intervalWarning").hidden = tab.engine !== "widget" || !["360", "480"].includes(tab.interval);
  for (const engine of ["widget", "lightweight"] as const) {
    element(`${engine}Engine`).setAttribute("aria-selected", String(tab.engine === engine));
    element(`${engine}Engine`).tabIndex = tab.engine === engine ? 0 : -1;
  }
  element("localTools").hidden = tab.engine !== "lightweight";
  element("container").setAttribute("aria-labelledby", `${tab.engine}Engine`);
  element("customIndicators").replaceChildren(...tab.customIndicators.map(indicator => {
    const chip = document.createElement("span");
    chip.className = "indicator-chip";
    const label = document.createElement("span");
    label.textContent = indicator.name;
    const remove = button("×", "indicator-remove", () => {
      tab.customIndicators = tab.customIndicators.filter(item => item.id !== indicator.id);
      persist(); render();
    });
    remove.setAttribute("aria-label", `Remove ${indicator.name}`);
    chip.append(label, remove);
    return chip;
  }));
  element<HTMLButtonElement>("loadIndicator").disabled = tab.customIndicators.length >= MAX_INDICATORS;
  cache.retain(new Set(state.workspaces.flatMap(item => item.tabs.flatMap(chart => ["widget", "lightweight"].map(engine => JSON.stringify([item.id, chart.id, engine]))))));
  showChart();
}

function openRename(kind: "workspace" | "chart", tabId?: string) {
  const workspace = activeWorkspace(state);
  const tab = workspace.tabs.find(value => value.id === tabId);
  renameTarget = { kind, workspaceId: workspace.id, tabId };
  previousFocus = document.activeElement as HTMLElement | null;
  element("renameTitle").textContent = kind === "workspace" ? "Rename workspace" : "Rename chart";
  renameInput.value = kind === "workspace" ? workspace.name : tab?.name ?? "Chart";
  renameDialog.hidden = false;
  renameInput.focus(); renameInput.select();
}

function closeRename() {
  renameDialog.hidden = true;
  renameTarget = undefined;
  previousFocus?.focus();
}

element("renameForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = renameInput.value.trim();
  if (!name || !renameTarget) { return; }
  const workspace = state.workspaces.find(item => item.id === renameTarget?.workspaceId);
  if (workspace) {
    if (renameTarget.kind === "workspace") { workspace.name = name; }
    else {
      const tab = workspace.tabs.find(item => item.id === renameTarget?.tabId);
      if (tab) { tab.name = name; }
    }
    persist(); render();
  }
  closeRename();
});
element("cancelRename").addEventListener("click", closeRename);
renameDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeRename(); }
  if (event.key === "Tab") {
    const controls = [...renameDialog.querySelectorAll<HTMLElement>("input, button")];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
element("renameWorkspace").addEventListener("click", () => openRename("workspace"));
workspaceSelect.addEventListener("change", () => { state.activeWorkspaceId = workspaceSelect.value; persist(); render(); });
element("addWorkspace").addEventListener("click", () => {
  const id = newId();
  const tab = createTab(newId());
  state.workspaces.push({ id, name: `Workspace ${state.workspaces.length + 1}`, tabs: [tab], activeTabId: tab.id });
  state.activeWorkspaceId = id;
  persist(); render();
  openRename("workspace");
});
element("closeWorkspace").addEventListener("click", () => {
  if (state.workspaces.length === 1) { return; }
  // A workspace can hold multiple charts: require explicit confirmation before removing it.
  vscode.postMessage({ type: "confirmRemoveWorkspace", workspaceId: activeWorkspace(state).id, name: activeWorkspace(state).name });
});
window.addEventListener("message", event => {
  if (event.source && event.source !== window) { return; }
  if (event.data?.type === "indicatorLoaded") {
    const workspace = state.workspaces.find(item => item.id === event.data.workspaceId);
    const tab = workspace?.tabs.find(item => item.id === event.data.tabId);
    if (tab && tab.customIndicators.length < MAX_INDICATORS) {
      tab.customIndicators = normalizeCustomIndicators([...tab.customIndicators, { id: newId(), name: event.data.name, source: event.data.source }]);
      persist(); render();
    }
    return;
  }
  if (event.data?.type !== "removeWorkspace" || state.workspaces.length === 1) { return; }
  const index = state.workspaces.findIndex(item => item.id === event.data.workspaceId);
  if (index < 0) { return; }
  state.workspaces.splice(index, 1);
  if (!state.workspaces.some(item => item.id === state.activeWorkspaceId)) { state.activeWorkspaceId = state.workspaces[0].id; }
  persist(); render();
});
element("addTab").addEventListener("click", () => {
  const workspace = activeWorkspace(state);
  const base = activeTab(state);
  const tab = { ...base, id: newId(), name: `Chart ${workspace.tabs.length + 1}`, studies: [...base.studies], customIndicators: base.customIndicators.map(indicator => ({ ...indicator })) };
  workspace.tabs.push(tab); workspace.activeTabId = tab.id;
  persist(); render();
});
element("toggleSettings").addEventListener("click", () => { state.ui.isToolbarCollapsed = !state.ui.isToolbarCollapsed; persist(); render(); });
element("retryChart").addEventListener("click", () => showChart(true));
for (const engine of ["widget", "lightweight"] as const) {
  const node = element(`${engine}Engine`);
  node.addEventListener("click", () => { activeTab(state).engine = engine; persist(); render(); });
  node.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? "widget" : event.key === "End" ? "lightweight" : engine === "widget" ? "lightweight" : "widget";
      element(`${next}Engine`).click(); element(`${next}Engine`).focus();
    }
  });
}
element("loadIndicator").addEventListener("click", () => {
  vscode.postMessage({ type: "loadIndicator", workspaceId: activeWorkspace(state).id, tabId: activeTab(state).id });
});
symbolInput.addEventListener("change", () => { activeTab(state).symbol = symbolInput.value.trim().toUpperCase() || DEFAULT_SYMBOL; persist(); render(); });
intervalSelect.addEventListener("change", () => { activeTab(state).interval = intervalSelect.value; persist(); render(); });
studiesInput.addEventListener("change", () => { activeTab(state).studies = normalizeStudies(studiesInput.value.split(",")); persist(); render(); });
for (const node of element("themeToggle").querySelectorAll<HTMLButtonElement>("button")) {
  node.addEventListener("click", () => { activeTab(state).theme = node.dataset.theme === "light" ? "light" : "dark"; persist(); render(); });
}
// Save edited text before VS Code hides/disposes the page, without recreating a chart.
function flushInputs() {
  activeTab(state).symbol = symbolInput.value.trim().toUpperCase() || DEFAULT_SYMBOL;
  activeTab(state).studies = normalizeStudies(studiesInput.value.split(","));
  persist();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) { flushInputs(); } });
window.addEventListener("beforeunload", flushInputs);
persist(); render();

// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { TradingViewProvider } from "../../src/tradingViewProvider";
import { activeTab, activeWorkspace, normalizeState } from "../../src/chartState";
import type { TradingViewState } from "../../src/chartState";
import type { widgetOptions } from "../../src/theme";
import { BUILTIN_INDICATORS } from "../../src/indicators/catalog";

vi.mock("../../src/marketData/widgetFeed", () => ({ WidgetFeed: class { dispose = vi.fn(); } }));
const observers = vi.hoisted(() => [] as ((symbol: string, interval: string) => void)[]);
vi.mock("../../src/webview/widgetObserver", () => ({ observeWidget: (widget: { remove?: () => void }, changed: (symbol: string, interval: string) => void) => {
  observers.push(changed); return { setVisible: vi.fn(), remove: () => widget.remove?.() };
} }));

const localCharts = vi.hoisted(() => [] as { remove: ReturnType<typeof vi.fn>; setVisible: ReturnType<typeof vi.fn> }[]);
vi.mock("../../src/webview/lightweightChart", () => ({
  createLightweightChart: () => {
    const chart = { remove: vi.fn(), setVisible: vi.fn() };
    localCharts.push(chart);
    return chart;
  }
}));

let detach = () => {};
async function mount(initial?: unknown, restored?: unknown, missingLibrary = false) {
  detach();
  vi.resetModules();
  const clone = <T>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));
  let persisted = clone(initial);
  let local = clone(restored);
  let receive: (message: unknown) => unknown = () => {};
  const host = {
    get: <T>() => persisted as T,
    keys: () => [],
    update: async (_key: string, value: unknown) => { persisted = clone(value); }
  } as vscode.Memento;
  const webview = {
    html: "", cspSource: "https://webview.test", options: {},
    asWebviewUri: (uri: unknown) => String(uri),
    onDidReceiveMessage: (listener: typeof receive) => { receive = listener; },
    postMessage: async (message: unknown) => { window.dispatchEvent(new MessageEvent("message", { data: message })); return true; }
  };
  const provider = new TradingViewProvider({} as vscode.Uri, host);
  provider.resolveWebviewView({ webview } as unknown as vscode.WebviewView, {} as vscode.WebviewViewResolveContext, {} as vscode.CancellationToken);
  document.documentElement.innerHTML = webview.html;
  class Widget {
    remove = vi.fn();
    customIndicators: string[] = [];
    constructor(public options: ReturnType<typeof widgetOptions>) { instances.push(this); }
  }
  const instances: Widget[] = [];
  if (missingLibrary) { delete window.TradingView; } else { window.TradingView = { widget: Widget }; }
  vi.stubGlobal("acquireVsCodeApi", () => ({
    getState: () => local,
    setState: (state: TradingViewState) => { local = clone(state); },
    postMessage: (message: unknown) => receive(clone(message))
  }));
  const windowEvents = vi.spyOn(window, "addEventListener"), documentEvents = vi.spyOn(document, "addEventListener");
  await import("../../src/webview/main");
  const listeners = windowEvents.mock.calls.slice(), documentListeners = documentEvents.mock.calls.slice();
  windowEvents.mockRestore(); documentEvents.mockRestore();
  detach = () => {
    for (const [type, listener, options] of listeners) { window.removeEventListener(type, listener, options); }
    for (const [type, listener, options] of documentListeners) { document.removeEventListener(type, listener, options); }
    provider.dispose();
  };
  return {
    instances, html: webview.html,
    state: () => clone(local) as TradingViewState,
    saved: () => clone(persisted) as TradingViewState,
    send: (message: unknown) => receive(message)
  };
}

function click(selector: string) { document.querySelector<HTMLButtonElement>(selector)!.click(); }
function change(selector: string, value: string) {
  const node = document.querySelector<HTMLInputElement>(selector)!;
  node.value = value; node.dispatchEvent(new Event("change"));
}
function rename(name: string) {
  const input = document.querySelector<HTMLInputElement>("#renameInput")!;
  input.value = name;
  document.querySelector<HTMLFormElement>("#renameForm")!.dispatchEvent(new Event("submit", { cancelable: true }));
}

beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localCharts.length = 0; observers.length = 0; });

describe("terminal Webview interactions", () => {
  it("resets observed context after main recreation and waits for its fresh confirmation", async () => {
    const page = await mount();
    observers[0]("BATS_DLY:MSFT", "60");
    expect(document.querySelector("#followStatus")!.textContent).toContain("Following main: BATS_DLY:MSFT");
    click('button[data-theme="light"]');
    expect(page.instances).toHaveLength(2);
    expect(document.querySelector("#followStatus")!.textContent).toContain("Following settings: BINANCE:ETHUSDT");
    observers[1]("BINANCE:ETHUSDT", "240");
    expect(document.querySelector("#followStatus")!.textContent).toContain("Following main: BINANCE:ETHUSDT");
  });
  it("saves built-in selections per chart and preserves the picker and hosted instance", async () => {
    const page = await mount();

    const picker = document.querySelector<HTMLElement>("#builtinDropdown")!;
    click("#builtinToggle");
    const fib = document.querySelector<HTMLInputElement>("#builtin-auto-fib")!;
    fib.checked = true; fib.dispatchEvent(new Event("change"));
    expect(activeTab(page.saved()).localIndicators).toEqual(["auto-fib"]);
    expect(document.querySelector("#builtin-auto-fib")).toBe(fib);
    expect(picker.hidden).toBe(false);
    click("#addTab");
    expect(picker.hidden).toBe(true);
    click("#builtinToggle");
    const second = document.querySelector<HTMLInputElement>("#builtin-auto-fib")!;
    second.checked = false; second.dispatchEvent(new Event("change"));
    expect(activeWorkspace(page.saved()).tabs[0].localIndicators).toEqual(["auto-fib"]);
    expect(activeWorkspace(page.saved()).tabs[1].localIndicators).toEqual([]);
    click(".tab-switch");
    expect(page.instances).toHaveLength(2);
    expect(page.instances[0].remove).not.toHaveBeenCalled();

    expect(document.querySelector<HTMLInputElement>("#builtin-auto-fib")!.checked).toBe(true);
    expect(document.querySelector<HTMLInputElement>("#studiesInput")!.disabled).toBe(false);
    expect(activeTab(page.saved()).studies).toContain("MASimple@tv-basicstudies");
    const restored = await mount(page.saved());
    expect(activeTab(restored.state()).localIndicators).toEqual(["auto-fib"]);
  });

  it("searches names and Chinese aliases without clearing hidden selections or rebuilding charts", async () => {
    const page = await mount();
     click("#builtinToggle");
    const search = document.querySelector<HTMLInputElement>("#builtinSearch")!;
    const query = (value: string) => { search.value = value; search.dispatchEvent(new Event("input")); };
    query("MaCd");
    expect(document.querySelectorAll(".builtin-option:not([hidden])")).toHaveLength(1);
    click("#builtin-macd");
    const instances = localCharts.length;
    query("斐波那契 回撤");
    expect(document.querySelectorAll(".builtin-option:not([hidden])")).toHaveLength(1);
    expect(document.querySelector("#builtin-auto-fib")!.closest("label")!.hidden).toBe(false);
    expect(activeTab(page.saved()).localIndicators).toEqual(["macd"]);
    query("nothing-matches");
    expect(document.querySelector<HTMLElement>("#builtinEmpty")!.hidden).toBe(false);
    expect(document.querySelectorAll(".builtin-option:not([hidden])")).toHaveLength(0);
    query("");
    expect(document.querySelectorAll(".builtin-option:not([hidden])")).toHaveLength(BUILTIN_INDICATORS.length);
    expect(document.querySelector<HTMLInputElement>("#builtin-macd")!.checked).toBe(true);
    expect(localCharts).toHaveLength(instances);
    expect(page.instances[0].remove).not.toHaveBeenCalled();
  });

  it("supports dropdown keyboard selection, Escape, and outside dismissal", async () => {
    const page = await mount();

    const toggle = document.querySelector<HTMLButtonElement>("#builtinToggle")!;
    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    const search = document.querySelector<HTMLInputElement>("#builtinSearch")!;
    expect(document.activeElement).toBe(search);
    search.value = "rsi"; search.dispatchEvent(new Event("input"));
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(document.querySelector("#builtin-rsi"));
    search.focus();
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(activeTab(page.saved()).localIndicators).toEqual(["rsi"]);
    search.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(document.querySelector<HTMLElement>("#builtinDropdown")!.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
    click("#builtinToggle");
    expect(search.value).toBe("");
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps cross-category overlays selected while category/search changes remain read-only", async () => {
    const page = await mount();  click("#builtinToggle");
    const category = document.querySelector<HTMLSelectElement>('[aria-label="Indicator category"]')!;
    category.value = "market-structure"; category.dispatchEvent(new Event("change"));
    expect(document.querySelector("#builtin-liquidity-sweeps")!.closest("label")!.hidden).toBe(false);
    expect(document.querySelector("#builtin-evasive-supertrend")!.closest("label")!.hidden).toBe(true);
    click("#builtin-liquidity-sweeps");
    category.value = "trend"; category.dispatchEvent(new Event("change")); click("#builtin-evasive-supertrend");
    expect(activeTab(page.saved()).localIndicators).toEqual(["evasive-supertrend", "liquidity-sweeps"]);
    const count = localCharts.length;
    category.value = "volume-order-flow"; category.dispatchEvent(new Event("change"));
    expect(localCharts).toHaveLength(count);
    expect(document.querySelectorAll(".selected-indicator")).toHaveLength(2);
    expect(page.instances[0].remove).not.toHaveBeenCalled();
  });

  it("shows a selected indicator guide on focus, closes it with Escape, and removes only that overlay", async () => {
    const page = await mount();  click("#builtinToggle"); click("#builtin-liquidity-sweeps"); click("#builtin-macd");
    const help = document.querySelector<HTMLButtonElement>('[aria-label="Guide: Liquidity Sweeps"]')!;
    const instances = localCharts.length; help.focus();
    const card = document.querySelector<HTMLElement>("#indicatorGuideCard")!;
    expect(card.hidden).toBe(false); expect(card.textContent).toContain("Only Wicks"); expect(card.textContent).toContain("LuxAlgo");
    expect(localCharts).toHaveLength(instances);
    help.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); expect(card.hidden).toBe(true);
    help.click(); expect(card.hidden).toBe(false);
    click('[aria-label="Remove Liquidity Sweeps"]');
    expect(activeTab(page.saved()).localIndicators).toEqual(["macd"]); expect(card.hidden).toBe(true);
    expect(activeTab(page.saved()).studies).toEqual(expect.arrayContaining(["MASimple@tv-basicstudies", "ZigZag@tv-basicstudies"]));
  });

  it("loads a selected JS file through the host and persists its source", async () => {
    const page = await mount();
    const source = "function calculate() { return []; }";
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ path: "/tmp/ema.js" } as vscode.Uri]);
    vi.spyOn(vscode.workspace.fs, "readFile").mockResolvedValue(new TextEncoder().encode(source));
    await page.send({ type: "loadIndicator", workspaceId: page.state().activeWorkspaceId, tabId: activeTab(page.state()).id });
    expect(activeTab(page.saved()).customIndicators[0]).toMatchObject({ name: "ema.js", source });
  });

  it("does not load executable files in untrusted workspaces", async () => {
    const page = await mount();
    vi.spyOn(vscode.workspace, "isTrusted", "get").mockReturnValue(false);
    const open = vi.spyOn(vscode.window, "showOpenDialog");
    await page.send({ type: "loadIndicator", workspaceId: page.state().activeWorkspaceId, tabId: activeTab(page.state()).id });
    expect(open).not.toHaveBeenCalled();
    expect(activeTab(page.saved()).customIndicators).toEqual([]);
  });

  it("rejects oversized indicator files without saving partial source", async () => {
    const page = await mount();
    vi.spyOn(vscode.window, "showOpenDialog").mockResolvedValue([{ path: "/tmp/large.js" } as vscode.Uri]);
    vi.spyOn(vscode.workspace.fs, "readFile").mockResolvedValue(new Uint8Array(65 * 1024));
    const error = vi.spyOn(vscode.window, "showErrorMessage");
    await page.send({ type: "loadIndicator", workspaceId: page.state().activeWorkspaceId, tabId: activeTab(page.state()).id });
    expect(error).toHaveBeenCalledWith("JS indicator files must be 64 KiB or smaller.");
    expect(activeTab(page.saved()).customIndicators).toEqual([]);
  });

  it("shows both charts and rebuilds only the preview when local selections change", async () => {
    const page = await mount();
    expect(document.querySelector("#container")!.closest("section")!.hidden).toBe(false);
    expect(document.querySelector("#previewContainer")!.closest("section")!.hidden).toBe(false);
    expect(document.querySelector("#widgetEngine")).toBeNull();
    expect(localCharts).toHaveLength(1);
    page.instances[0].customIndicators.push("internal edit");
    click("#builtinToggle"); click("#builtin-macd");
    expect(localCharts).toHaveLength(2);
    expect(page.instances).toHaveLength(1);
    expect(page.instances[0].customIndicators).toEqual(["internal edit"]);
    click("#retryChart");
    expect(localCharts).toHaveLength(3);
    expect(page.instances[0].remove).not.toHaveBeenCalled();
    change("#intervalSelect", "360");
    expect(document.querySelector<HTMLElement>("#intervalWarning")!.hidden).toBe(false);
  });

  it("keeps old SOL configuration and uses ETH / 4H only in a new workspace", async () => {
    const page = await mount({ tabs: [{ id: "sol", name: "SOLUSDT", symbol: "BINANCE:SOLUSDT", interval: "15" }] });
    expect(activeTab(page.state())).toMatchObject({ name: "SOLUSDT", symbol: "BINANCE:SOLUSDT", interval: "15", engine: "widget" });
    click("#addWorkspace");
    expect(activeTab(page.state())).toMatchObject({ symbol: "BINANCE:ETHUSDT", interval: "240" });
  });

  it("shows main library failures while keeping the independent preview available", async () => {
    await mount(undefined, undefined, true);
    await vi.waitFor(() => expect(document.querySelector("#chartNotice")!.textContent).toContain("Could not load TradingView"));
    expect(document.querySelector<HTMLElement>("#chartNotice")!.hidden).toBe(false);

    expect(localCharts).toHaveLength(1);
    expect(document.querySelector<HTMLElement>("#chartNotice")!.hidden).toBe(false);
  });

  it("explicitly reloads the main chart without rebuilding the preview", async () => {
    const page = await mount();
    click("#addTab");
    click("#reloadWidget");
    expect(page.instances).toHaveLength(3);
    expect(page.instances[1].remove).toHaveBeenCalledOnce();
    expect(page.instances[0].remove).not.toHaveBeenCalled();
  });

  it("persists loaded JS source for the target chart without rebuilding the main chart", async () => {
    const page = await mount();
    const workspace = activeWorkspace(page.state());
    const tab = activeTab(page.state());
    window.dispatchEvent(new MessageEvent("message", { data: { type: "indicatorLoaded", workspaceId: workspace.id, tabId: tab.id, name: "EMA 20.js", source: "function calculate(bars) { return []; }" } }));
    expect(activeTab(page.saved()).customIndicators[0].name).toBe("EMA 20.js");
    expect(page.instances).toHaveLength(1);

    expect(activeTab(page.saved()).customIndicators).toHaveLength(1);
  });

  it("can create charts and workspaces when randomUUID is unavailable", async () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", { getRandomValues });
    const page = await mount();
    click("#addTab");
    expect(activeWorkspace(page.state()).tabs).toHaveLength(2);
    click("#addWorkspace");
    expect(page.state().workspaces).toHaveLength(2);
  });

  it("keeps the same widget and internal indicator edits when switching charts", async () => {
    const page = await mount();
    page.instances[0].customIndicators.push("custom MA settings");
    click("#addTab");
    expect(page.instances).toHaveLength(2);
    click(".tab-switch");
    expect(page.instances).toHaveLength(2);
    expect(page.instances[0].remove).not.toHaveBeenCalled();
    expect(page.instances[0].customIndicators).toEqual(["custom MA settings"]);
    expect(document.getElementById(page.instances[0].options.container_id)!.hidden).toBe(false);
  });

  it("renames charts and workspaces without rebuilding their chart", async () => {
    const page = await mount();
    click(".tab-rename"); rename("BTC trend");
    click("#renameWorkspace"); rename("Swing desk");
    expect(activeTab(page.saved()).name).toBe("BTC trend");
    expect(activeWorkspace(page.saved()).name).toBe("Swing desk");
    expect(document.querySelector(".tab-switch")!.textContent).toBe("BTC trend");
    expect(page.instances).toHaveLength(1);
  });

  it("creates isolated workspaces and returns to the original live chart", async () => {
    const page = await mount();
    const firstId = page.state().activeWorkspaceId;
    click("#addWorkspace"); rename("Scalp");
    expect(page.state().workspaces).toHaveLength(2);
    change("#symbolInput", "BINANCE:BTCUSDT");
    change("#workspaceSelect", firstId);
    expect(activeTab(page.state()).symbol).toBe("BINANCE:ETHUSDT");
    expect(page.instances[0].remove).not.toHaveBeenCalled();
    expect(document.getElementById(page.instances[0].options.container_id)!.hidden).toBe(false);
  });

  it("retains mandatory indicators when editing additions, then restores saved state", async () => {
    const page = await mount();
    change("#studiesInput", "RSI@tv-basicstudies");
    click("#themeToggle button[data-theme=light]");
    const saved = page.saved();
    expect(activeTab(saved).studies).toHaveLength(3);
    const reopened = await mount(saved);
    expect(reopened.instances[0].options.theme).toBe("light");
    expect(reopened.instances[0].options.studies).toContain("RSI@tv-basicstudies");
  });

  it("destroys closed charts but keeps the final chart", async () => {
    const page = await mount();
    click("#addTab");
    click(".tab.active .tab-close");
    expect(page.instances[1].remove).toHaveBeenCalledOnce();
    expect(activeWorkspace(page.state()).tabs).toHaveLength(1);
    expect(document.querySelector<HTMLButtonElement>(".tab-close")!.disabled).toBe(true);
    expect(page.instances[0].remove).not.toHaveBeenCalled();
  });

  it("shows a warning for 6h/8h requests and keeps toolbar changes working", async () => {
    const page = await mount();
    change("#intervalSelect", "360");
    expect(page.instances.at(-1)!.options.interval).toBe("360");
    expect(document.querySelector<HTMLElement>("#intervalWarning")!.hidden).toBe(false);
    change("#intervalSelect", "60");
    expect(document.querySelector<HTMLElement>("#intervalWarning")!.hidden).toBe(true);
    expect(document.querySelector("#toggleSettings")!.textContent).toBe("Show Settings");
    click("#toggleSettings");
    expect(page.saved().ui.isToolbarCollapsed).toBe(false);
  });

  it("escapes injected state and renders rename text without HTML execution", async () => {
    const initial = normalizeState({ tabs: [{ name: "<img src=x onerror=alert(1)>", symbol: "</script><script>alert(1)</script>" }] });
    const page = await mount(initial);
    expect(page.html).not.toContain("</script><script>alert(1)");
    expect(page.html).toMatch(/\\u003c\/script>/i);
    expect(document.querySelector(".tab-switch img")).toBeNull();
    expect(page.html).not.toContain("'unsafe-eval'");
  });
});

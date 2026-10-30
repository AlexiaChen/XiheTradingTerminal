// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import { TradingViewProvider } from "../../src/tradingViewProvider";
import { activeTab, activeWorkspace, normalizeState } from "../../src/chartState";
import type { TradingViewState } from "../../src/chartState";
import type { widgetOptions } from "../../src/theme";

async function mount(initial?: unknown, restored?: unknown) {
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
  window.TradingView = { widget: Widget };
  vi.stubGlobal("acquireVsCodeApi", () => ({
    getState: () => local,
    setState: (state: TradingViewState) => { local = clone(state); },
    postMessage: (message: unknown) => receive(clone(message))
  }));
  await import("../../src/webview/main");
  return {
    instances, html: webview.html,
    state: () => clone(local) as TradingViewState,
    saved: () => clone(persisted) as TradingViewState
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

beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });

describe("terminal Webview interactions", () => {
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

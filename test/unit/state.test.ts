import { describe, expect, it } from "vitest";
import { activeTab, activeWorkspace, MAX_INDICATOR_BYTES, normalizeCustomIndicators, normalizeState, normalizeStudies, REQUIRED_STUDIES } from "../../src/chartState";
import { widgetOptions } from "../../src/theme";

describe("workspace state", () => {
  it("creates fresh defaults with mandatory indicators", () => {
    const state = normalizeState(undefined);
    expect(state.workspaces).toHaveLength(1);
    expect(activeTab(state)).toMatchObject({ symbol: "BINANCE:ETHUSDT", interval: "240", theme: "dark", studies: REQUIRED_STUDIES });
    expect(state.ui.isToolbarCollapsed).toBe(true);
    expect(normalizeState({ ui: { isToolbarCollapsed: false } }).ui.isToolbarCollapsed).toBe(false);
  });

  it("migrates old tabs without losing independent indicators or configuration", () => {
    const state = normalizeState({ tabs: [{ id: "old", name: "BTC", symbol: "binance:btcusdt", interval: 480, theme: "light", studies: ["RSI@tv-basicstudies"] }], activeTabId: "old", ui: { isToolbarCollapsed: true } });
    expect(activeTab(state)).toMatchObject({ id: "old", name: "BTC", symbol: "BINANCE:BTCUSDT", interval: "480", theme: "light" });
    expect(activeTab(state).studies).toEqual([...REQUIRED_STUDIES, "RSI@tv-basicstudies"]);
    expect(state.ui.isToolbarCollapsed).toBe(true);
    expect(normalizeState(state)).toEqual(state);
  });

  it("keeps workspace names, active chart, and selection across round trips", () => {
    const state = normalizeState({ workspaces: [{ id: "one", name: "Swing", tabs: [{ id: "a", name: "Trend" }] }, { id: "two", name: "Intraday", tabs: [{ id: "b", name: "Entry", interval: "360" }], activeTabId: "b" }], activeWorkspaceId: "two" });
    expect(activeWorkspace(state).name).toBe("Intraday");
    expect(activeTab(state).name).toBe("Entry");
    expect(normalizeState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it("recovers invalid selections and duplicate IDs without discarding charts", () => {
    const state = normalizeState({ workspaces: [{ id: "same", tabs: [{ id: "same" }, { id: "same" }], activeTabId: "bad" }, { id: "same", tabs: [] }], activeWorkspaceId: "bad" });
    expect(new Set(state.workspaces.map(item => item.id)).size).toBe(2);
    expect(new Set(state.workspaces[0].tabs.map(item => item.id)).size).toBe(2);
    expect(activeTab(state).id).toBe(state.workspaces[0].tabs[0].id);
    expect(state.workspaces[1].tabs).toHaveLength(1);
  });

  it("does not allow additional-indicator edits to remove required defaults", () => {
    expect(normalizeStudies(["", REQUIRED_STUDIES[0], 12, " RSI@tv-basicstudies "])).toEqual([...REQUIRED_STUDIES, "RSI@tv-basicstudies"]);
  });

  it("migrates to the hosted engine and retains local JS configuration on round trips", () => {
    const legacy = normalizeState({ tabs: [{ symbol: "BINANCE:SOLUSDT" }] });
    expect(activeTab(legacy)).toMatchObject({ engine: "widget", customIndicators: [], symbol: "BINANCE:SOLUSDT" });
    activeTab(legacy).engine = "lightweight";
    activeTab(legacy).customIndicators = [{ id: "ema", name: "EMA 20", source: "function calculate() { return []; }" }];
    expect(normalizeState(JSON.parse(JSON.stringify(legacy)))).toEqual(legacy);
    expect(normalizeCustomIndicators([{ source: "x".repeat(MAX_INDICATOR_BYTES + 1) }])).toEqual([]);
  });
});

describe("hosted widget configuration", () => {
  it.each(["360", "480"])("forwards interval %s without claiming remote support", interval => {
    const tab = activeTab(normalizeState(undefined));
    expect(widgetOptions({ ...tab, interval }, "test").interval).toBe(interval);
  });

  it.each(["dark", "light"] as const)("sets default indicator inputs and Gruvbox %s colors", theme => {
    const options = widgetOptions({ ...activeTab(normalizeState(undefined)), theme }, "test");
    expect(options.studies).toEqual(REQUIRED_STUDIES);
    expect(options.studies_overrides).toMatchObject({ "moving average.length": 90, "zigzag.deviation (%)": 5, "zigzag.depth": 10 });
    for (const property of ["upColor", "borderUpColor", "wickUpColor"]) {
      expect(options.overrides[property === "upColor" ? "mainSeriesProperties.candleStyle.upColor" : `mainSeriesProperties.candleStyle.${property}` as keyof typeof options.overrides]).toBe("#83a598");
    }
    expect(options.overrides["mainSeriesProperties.candleStyle.downColor"]).toBe("#d79921");
    expect(options.backgroundColor).toBe(theme === "dark" ? "#282828" : "#fbf1c7");
  });
});

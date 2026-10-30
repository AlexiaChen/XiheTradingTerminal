import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { ChartTab } from "../chartState";
import { INTERVALS, mergeCandles, type Candle } from "../marketData";
import { sma, zigzag, type IndicatorPoint } from "../indicators";

import { BuiltinRenderer } from "./builtinRenderer";
import { GRUVBOX_PALETTE } from "../theme";
import { runIndicator } from "./indicatorRunner";
import { indicatorDataRequirements } from "../marketData/indicatorData";
import { subscribePreview } from "./previewFeed";
import type { FeedEvent, SymbolInfo } from "../marketData/widgetProtocol";

export function createLightweightChart(tab: ChartTab, containerId: string, trusted: boolean, send: (message: unknown) => void) {
  const container = document.getElementById(containerId)!;
  container.classList.add("local-chart");
  const legend = document.createElement("div");
  legend.className = "local-legend";
  const title = document.createElement("strong");
  title.textContent = `${tab.symbol} · ${INTERVALS[tab.interval] ?? tab.interval} · UTC`;
  const labels = document.createElement("span");
  labels.textContent = "MA 90 · ZigZag 5%, 10";
  legend.append(title, labels);
  const status = document.createElement("div");
  status.className = "local-status";
  status.setAttribute("role", "status");
  status.textContent = "Connecting to the hosted Widget feed…";
  const canvas = document.createElement("div");
  canvas.className = "local-canvas";
  container.append(legend, status, canvas);
  const dashboards = document.createElement("div"); dashboards.className = "local-dashboards";
  container.insertBefore(dashboards, canvas);
  const notes = document.createElement("details"); notes.className = "local-notices"; notes.hidden = true;
  const notesSummary = document.createElement("summary"), notesBody = document.createElement("div");
  notes.append(notesSummary, notesBody); container.insertBefore(notes, canvas);
  const palette = GRUVBOX_PALETTE[tab.theme];
  const { up, down } = GRUVBOX_PALETTE;
  const chart = createChart(canvas, {
    autoSize: true,
    layout: { background: { type: ColorType.Solid, color: palette.background }, textColor: palette.text, attributionLogo: true, fontSize: 11 },
    grid: { vertLines: { color: palette.grid }, horzLines: { color: palette.grid } },
    rightPriceScale: { borderColor: palette.grid },
    timeScale: { borderColor: palette.grid, timeVisible: true, secondsVisible: false },
    crosshair: { vertLine: { labelBackgroundColor: up }, horzLine: { labelBackgroundColor: up } }
  });
  const candles = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down });
  const average = chart.addSeries(LineSeries, { title: "MA 90", color: up, lineWidth: 2, priceLineVisible: false });
  const pivots = chart.addSeries(LineSeries, { title: "ZigZag 5%, 10", color: down, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
  const builtins = new BuiltinRenderer(chart, candles, tab.localIndicators);
  const supported = new Set(["ZigZag@tv-basicstudies", "MASimple@tv-basicstudies", "Volume@tv-basicstudies", "RSI@tv-basicstudies"]);
  const unsupported = tab.studies.filter(study => !supported.has(study));
  const custom = new Map<string, ISeriesApi<"Line" | "Histogram">>();
  const customPanes = new Map<string, number>();
  let bars: Candle[] = [];
  let auxiliary = new Map<string, Candle[]>();
  let info: SymbolInfo | undefined;
  let first = true, pending = false, rendering = false;
  let feed: ReturnType<typeof subscribePreview> | undefined;
  let reportedRender = false;
  let lastRenderError = "";
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;
  let visible = true;
  let disposed = false;
  let connectionMessage = "Connecting to the hosted Widget feed…";

  const data = (points: IndicatorPoint[]) => points.map(point => ({ ...point, time: point.time as UTCTimestamp }));

  async function refresh() {
    if (disposed || !visible || document.hidden || !bars.length || !info) { return; }
    if (rendering) { pending = true; return; }
    rendering = true; pending = false;
    const controller = new AbortController(); request = controller;
    // Keep this render coherent even if a new stream snapshot arrives while a Worker is running.
    const snapshot = bars, source = info, context = new Map(auxiliary);
    try {
      const close = bars.at(-1)!.close;
      const tick = source.minTick > 0 ? source.minTick : close >= 100 ? 0.01 : 0.0001;
      const precision = Math.min(10, Math.max(0, String(tick).includes("e-") ? Number(String(tick).split("e-")[1]) : (String(tick).split(".")[1]?.length ?? 0)));
      const priceFormat = { type: "price" as const, precision, minMove: tick };
      candles.applyOptions({ priceFormat });
      average.applyOptions({ priceFormat });
      pivots.applyOptions({ priceFormat });
      candles.setData(snapshot.map(bar => ({ ...bar, time: bar.time as UTCTimestamp })));
      average.setData(data(sma(snapshot)));
      pivots.setData(data(zigzag(snapshot)));
      if (first) { first = false; chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - 180), to: bars.length + (tab.localIndicators.some(id => ["htf-po3", "htf-reversal", "clusters-vp", "delta-flow", "liquidity-depth", "volume-nodes", "volumetric-structure"].includes(id)) ? 115 : 5) }); }
      const warnings = unsupported.length ? [`Main-chart-only indicators retained: ${unsupported.join(", ")}`] : [];
      const missing = indicatorDataRequirements(tab.localIndicators, tab.interval).filter(tf => !context.has(tf));
      if (missing.length) { warnings.push(`Awaiting auxiliary Widget data: ${missing.join(", ")}. Missing coverage is not replaced with main bars.`); }
      if (!source.volumeAvailable) { warnings.push("This Widget source has no complete volume. Volume presets are skipped; custom JS receives NaN for missing volume."); }
      const rendered = builtins.update(snapshot, tab.interval, priceFormat, { series: context, theme: tab.theme, minTick: source.minTick, marketSession: source.session });
      warnings.push(...rendered.warnings);
      const names = rendered.names;
      const expanded = new Set([...dashboards.querySelectorAll("details[open] summary")].map(node => node.textContent));
      dashboards.replaceChildren(...rendered.tables.map(table => {
        const details = document.createElement("details"), summary = document.createElement("summary"), body = document.createElement("table");
        summary.textContent = table.title; details.open = expanded.has(table.title);
        for (const row of table.rows) { const tr = document.createElement("tr"); for (const value of row) { const td = document.createElement("td"); td.textContent = value; tr.append(td); } body.append(tr); }
        details.append(summary, body); return details;
      }));
      for (const indicator of tab.customIndicators) {
        if (!trusted) { warnings.push("Trust this VS Code workspace to run saved JS indicators."); break; }
        try {
          const plots = await runIndicator(indicator.source, snapshot, controller.signal);
          if (controller.signal.aborted || disposed) { return; }
          const used = new Set<string>();
          for (const [index, plot] of plots.entries()) {
            const key = `${indicator.id}:${index}:${plot.type}:${plot.pane}`;
            used.add(key);
            let series = custom.get(key);
            if (!series) {
              if (plot.pane && !customPanes.has(indicator.id)) { customPanes.set(indicator.id, builtins.allocateCustomPane()); }
              const paneIndex = plot.pane ? customPanes.get(indicator.id)! : 0;
              series = plot.type === "histogram" ? chart.addSeries(HistogramSeries, {}, paneIndex) : chart.addSeries(LineSeries, {}, paneIndex);
              custom.set(key, series);
            }
            series.applyOptions({ title: plot.name, color: plot.color, priceLineVisible: false });
            series.setData(data(plot.data));
            names.push(plot.name);
          }
          for (const [key, series] of custom) {
            if (key.startsWith(`${indicator.id}:`) && !used.has(key)) { chart.removeSeries(series); custom.delete(key); }
          }
        } catch (error) {
          if (controller.signal.aborted || disposed) { return; }
          warnings.push(`${indicator.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      labels.textContent = ["MA 90", "ZigZag 5%, 10", ...names].join(" · ");
      notes.hidden = !warnings.length; notesSummary.textContent = `Indicator notes (${warnings.length}) · data coverage and preset limits`;
      notesBody.replaceChildren(...warnings.map(message => { const paragraph = document.createElement("p"); paragraph.textContent = message; return paragraph; }));
      updateStatus();
      if (!reportedRender) { feed?.report({ stage: "rendered", bars: snapshot.length }); reportedRender = true; }
      lastRenderError = "";
    } catch (error) {
      if (!controller.signal.aborted && !disposed) {
        const message = error instanceof Error ? error.message : String(error);
        status.textContent = `Indicator preview: ${message}`;
        if (message !== lastRenderError) { feed?.report({ stage: "renderError", message }); lastRenderError = message; }
      }
    } finally {
      rendering = false;
      if (pending && !disposed && visible && !document.hidden) { scheduleRender(); }
    }
  }

  function updateStatus() {
    const source = info;
    title.textContent = source ? `${source.symbol} · ${INTERVALS[source.interval] ?? source.interval} · UTC display` : `${tab.symbol} · ${tab.interval}`;
    const delayed = source?.status.match(/delayed_streaming_(\d+)/);
    const timing = delayed ? `delayed ${Number(delayed[1]) / 60} min` : source?.status === "streaming" ? "streaming" : source?.status ?? "connecting";
    status.textContent = [connectionMessage, ...(source ? [`Widget feed · ${source.exchange} · ${timing} · ${bars.length} bars`, `Source timezone ${source.timezone} · session ${source.session}`, source.requestedSymbol !== source.symbol ? `Requested ${source.requestedSymbol} → ${source.symbol}` : ""] : [])].filter(Boolean).join(" | ");
  }
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => { void refresh(); }, 100);
  }
  function receive(event: FeedEvent) {
    if (disposed || !visible) { return; }
    if (event.kind === "status") {
      if (event.state === "connecting" || event.state === "reconnecting") { auxiliary.clear(); }
      connectionMessage = `${bars.length ? "Showing last received candles. " : ""}${event.message}`;
      updateStatus(); if (bars.length) { scheduleRender(); } return;
    }
    const incoming = event.bars.map(bar => ({ ...bar, volume: bar.volume === null ? NaN : bar.volume }));
    if (event.resolution === "main") {
      if (info && info.symbol !== event.info.symbol) { auxiliary = new Map(); first = true; }
      info = event.info;
      bars = event.reset ? incoming : mergeCandles(bars, incoming);
      connectionMessage = `Updated ${new Date().toISOString().slice(11, 19)} UTC`;
    } else {
      // Source identity is checked in the host too. Never mix auxiliary markets.
      if (info && event.info.symbol !== info.symbol) { return; }
      auxiliary.set(event.resolution, event.reset ? incoming : mergeCandles(auxiliary.get(event.resolution) ?? [], incoming, 12_000));
    }
    updateStatus(); scheduleRender();
  }
  function start() {
    if (disposed || !visible || document.hidden || feed) { return; }
    auxiliary.clear();
    reportedRender = false; lastRenderError = "";
    feed = subscribePreview({ symbol: tab.symbol, interval: tab.interval, auxiliary: indicatorDataRequirements(tab.localIndicators, tab.interval) }, send, receive);
  }
  function stop() { clearTimeout(renderTimer); request?.abort(); feed?.stop(); feed = undefined; }
  function onVisibility() { stop(); if (!document.hidden && visible) { start(); } }
  document.addEventListener("visibilitychange", onVisibility);
  start();
  return {
    setVisible(next: boolean) {
      if (next === visible || disposed) { return; }
      visible = next; stop();
      if (visible) { start(); }
    },
    remove() {
      disposed = true; stop();
      document.removeEventListener("visibilitychange", onVisibility);
      builtins.remove(); chart.remove();
    }
  };
}

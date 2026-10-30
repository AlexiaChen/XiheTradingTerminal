import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, LineStyle, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import type { ChartTab } from "../chartState";
import { fetchCandles, INTERVALS, mergeCandles, type Candle } from "../marketData";
import { sma, zigzag, type IndicatorPoint, type BuiltinPoint } from "../indicators";
import { BUILTIN_INDICATORS, type BuiltinIndicatorId } from "../indicators/catalog";
import { calculateBuiltin } from "../indicators/builtin";
import { GRUVBOX_PALETTE } from "../theme";
import { runIndicator } from "./indicatorRunner";

export function createLightweightChart(tab: ChartTab, containerId: string, trusted: boolean) {
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
  const canvas = document.createElement("div");
  canvas.className = "local-canvas";
  container.append(legend, status, canvas);
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
  let pane = 1;
  const configured = BUILTIN_INDICATORS.filter(item => tab.localIndicators.includes(item.id));
  const builtinPanes = new Map<BuiltinIndicatorId, number>(configured.filter(item => item.pane).map(item => [item.id, pane++]));
  const builtinSeries = new Map<string, ISeriesApi<"Line" | "Histogram">>();
  const supported = new Set(["ZigZag@tv-basicstudies", "MASimple@tv-basicstudies", "Volume@tv-basicstudies", "RSI@tv-basicstudies"]);
  const unsupported = tab.studies.filter(study => !supported.has(study));
  const custom = new Map<string, ISeriesApi<"Line" | "Histogram">>();
  const customPanes = new Map<string, number>();
  let bars: Candle[] = [];
  let needsHistory = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;
  let visible = true;
  let disposed = false;

  const data = (points: IndicatorPoint[]) => points.map(point => ({ ...point, time: point.time as UTCTimestamp }));
  const builtinData = (points: BuiltinPoint[]) => points.map(point => point.value === undefined ? { time: point.time as UTCTimestamp } : { ...point, value: point.value, time: point.time as UTCTimestamp });

  async function refresh() {
    if (disposed || !visible || document.hidden) { return; }
    const controller = new AbortController();
    request?.abort();
    request = controller;
    if (!bars.length) { status.textContent = "Loading Binance spot candles…"; }
    try {
      const incoming = await fetchCandles(tab.symbol, tab.interval, controller.signal, needsHistory || !bars.length ? 1000 : 2);
      if (controller.signal.aborted || disposed) { return; }
      const first = !bars.length;
      needsHistory = false;
      bars = mergeCandles(bars, incoming);
      const close = bars.at(-1)!.close;
      const precision = close >= 100 ? 2 : close >= 1 ? 4 : 8;
      const priceFormat = { type: "price" as const, precision, minMove: 10 ** -precision };
      candles.applyOptions({ priceFormat });
      average.applyOptions({ priceFormat });
      pivots.applyOptions({ priceFormat });
      candles.setData(bars.map(bar => ({ ...bar, time: bar.time as UTCTimestamp })));
      average.setData(data(sma(bars)));
      pivots.setData(data(zigzag(bars)));
      if (first) { chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, bars.length - 180), to: bars.length + 5 }); }
      const warnings = unsupported.length ? [`Widget-only indicators retained: ${unsupported.join(", ")}`] : [];
      const names: string[] = [];
      for (const indicator of configured) {
        const result = calculateBuiltin(indicator.id, bars, tab.interval);
        if (result.notice) { warnings.push(result.notice); }
        if (result.plots.length) { names.push(indicator.name); }
        const used = new Set<string>();
        for (const [index, plot] of result.plots.entries()) {
          const key = `${indicator.id}:${index}`;
          used.add(key);
          let series = builtinSeries.get(key);
          if (!series) {
            const paneIndex = builtinPanes.get(indicator.id) ?? 0;
            series = plot.type === "histogram" ? chart.addSeries(HistogramSeries, {}, paneIndex) : chart.addSeries(LineSeries, { lineWidth: 1 }, paneIndex);
            if (paneIndex) { chart.panes()[0].setStretchFactor(3); }
            builtinSeries.set(key, series);
          }
          series.applyOptions({ title: plot.name, color: plot.color, priceLineVisible: false,
            ...(plot.style === "dashed" ? { lineStyle: LineStyle.Dashed } : {}),
            ...(plot.style === "dots" ? { lineVisible: false, pointMarkersVisible: true, pointMarkersRadius: 3 } : {}),
            priceFormat: plot.volume ? { type: "volume" as const } : indicator.id === "rsi" || indicator.id === "stochastic" ? { type: "price" as const, precision: 2, minMove: 0.01 } : priceFormat
          });
          series.setData(builtinData(plot.data));
        }
        // A disappearing Fib swing must clear its old levels rather than leaving stale drawings.
        for (const [key, series] of builtinSeries) {
          if (key.startsWith(`${indicator.id}:`) && !used.has(key)) { series.setData([]); }
        }
      }
      for (const indicator of tab.customIndicators) {
        if (!trusted) { warnings.push("Trust this VS Code workspace to run saved JS indicators."); break; }
        try {
          const plots = await runIndicator(indicator.source, bars, controller.signal);
          if (controller.signal.aborted || disposed) { return; }
          const used = new Set<string>();
          for (const [index, plot] of plots.entries()) {
            const key = `${indicator.id}:${index}:${plot.type}:${plot.pane}`;
            used.add(key);
            let series = custom.get(key);
            if (!series) {
              if (plot.pane && !customPanes.has(indicator.id)) { customPanes.set(indicator.id, pane++); }
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
      status.textContent = [`Binance spot · ${bars.length} bars · refresh 15s · ${new Date().toISOString().slice(11, 19)} UTC`, ...warnings].join(" | ");
    } catch (error) {
      if (!controller.signal.aborted && !disposed) {
        needsHistory = true;
        status.textContent = `${bars.length ? "Showing last received candles. " : ""}${error instanceof Error ? error.message : String(error)} Retry Chart to reconnect.`;
      }
    } finally {
      if (!disposed && visible && !document.hidden && request === controller) { timer = setTimeout(() => { void refresh(); }, 15_000); }
    }
  }

  function stop() { clearTimeout(timer); request?.abort(); }
  function onVisibility() { stop(); needsHistory = true; if (!document.hidden && visible) { void refresh(); } }
  document.addEventListener("visibilitychange", onVisibility);
  void refresh();
  return {
    setVisible(next: boolean) {
      if (next === visible || disposed) { return; }
      visible = next;
      stop();
      needsHistory = true;
      if (visible) { void refresh(); }
    },
    remove() {
      disposed = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      chart.remove();
    }
  };
}

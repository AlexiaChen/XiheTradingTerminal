import { HistogramSeries, LineSeries, LineStyle, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { calculateBuiltin } from "../indicators/builtin";
import { BUILTIN_INDICATORS, type BuiltinIndicatorId } from "../indicators/catalog";
import type { BuiltinResult, IndicatorContext, IndicatorTable } from "../indicators/types";
import type { Candle } from "../marketData";
import { attachIndicatorPrimitive, type IndicatorPrimitive } from "./indicatorPrimitive";

/** Owns indicator rendering/lifecycle. The chart host only supplies data and the public chart API. */
export class BuiltinRenderer {
  private readonly series = new Map<string, ISeriesApi<"Line" | "Histogram">>();
  private readonly primitives = new Map<string, IndicatorPrimitive>();
  private readonly anchors = new Map<string, ISeriesApi<"Candlestick" | "Line">>();
  private readonly panes = new Map<string, number>();
  private nextPane = 1;

  constructor(private readonly chart: IChartApi, private readonly candles: ISeriesApi<"Candlestick">, private readonly ids: BuiltinIndicatorId[]) {}

  update(bars: Candle[], interval: string, priceFormat: { type: "price"; precision: number; minMove: number }, context?: IndicatorContext) {
    const warnings: string[] = [], names: string[] = [], tables: IndicatorTable[] = [];
    for (const indicator of BUILTIN_INDICATORS.filter(item => this.ids.includes(item.id))) {
      let result: BuiltinResult;
      try { result = calculateBuiltin(indicator.id, bars, interval, context); }
      catch (error) {
        warnings.push(`${indicator.name}: ${error instanceof Error ? error.message : String(error)}`);
        for (const [key, series] of this.series) { if (key.startsWith(`${indicator.id}:`)) { series.setData([]); } }
        for (const [key, primitive] of this.primitives) { if (key.startsWith(`${indicator.id}:`)) { primitive.update([]); } }
        continue;
      }
      if (result.notice) { warnings.push(`${indicator.name}: ${result.notice}`); }
      names.push(indicator.name);
      tables.push(...(result.tables ?? []));
      const used = new Set<string>();
      const paneSeries = new Map<number, ISeriesApi<"Line">>();
      for (const [index, plot] of result.plots.entries()) {
        const key = `${indicator.id}:${index}`; used.add(key);
        const localPane = plot.pane ?? (indicator.pane ? 1 : 0);
        const paneIndex = this.pane(indicator.id, localPane);
        let series = this.series.get(key);
        if (!series) {
          series = plot.type === "histogram" ? this.chart.addSeries(HistogramSeries, {}, paneIndex) : this.chart.addSeries(LineSeries, {}, paneIndex);
          this.series.set(key, series);
          if (paneIndex) { this.chart.panes()[0].setStretchFactor(3); }
        }
        series.applyOptions({ title: plot.data.at(-1)?.value === undefined ? "" : plot.name, color: plot.color, lineWidth: plot.width ?? 1, priceLineVisible: false, lastValueVisible: plot.data.at(-1)?.value !== undefined,
          lineStyle: plot.style === "dashed" ? LineStyle.Dashed : plot.style === "dotted" ? LineStyle.Dotted : LineStyle.Solid,
          lineVisible: plot.style !== "dots", pointMarkersVisible: plot.style === "dots", pointMarkersRadius: 3,
          priceFormat: plot.volume ? { type: "volume" } : indicator.id === "rsi" || indicator.id === "stochastic" ? { type: "price", precision: 2, minMove: 0.01 } : priceFormat
        });
        series.setData(plot.data.map(point => point.value === undefined ? { time: point.time as UTCTimestamp } : { ...point, value: point.value, time: point.time as UTCTimestamp }));
        if (plot.type === "line") { paneSeries.set(localPane, series as ISeriesApi<"Line">); }
      }
      for (const [key, series] of this.series) {
        if (key.startsWith(`${indicator.id}:`) && !used.has(key)) { series.setData([]); }
      }
      const drawingPanes = new Set((result.drawings ?? []).map(drawing => drawing.pane ?? 0));
      for (const localPane of drawingPanes) {
        const key = `${indicator.id}:${localPane}`;
        let primitive = this.primitives.get(key);
        if (!primitive) {
          const anchor = localPane === 0 ? this.candles : paneSeries.get(localPane);
          if (!anchor) { warnings.push(`No price series for ${indicator.name} pane ${localPane}`); continue; }
          primitive = attachIndicatorPrimitive(anchor); this.primitives.set(key, primitive); this.anchors.set(key, anchor);
        }
        primitive.update((result.drawings ?? []).filter(drawing => (drawing.pane ?? 0) === localPane), bars[0]?.time as UTCTimestamp | undefined);
      }
      for (const [key, primitive] of this.primitives) {
        if (key.startsWith(`${indicator.id}:`) && !drawingPanes.has(Number(key.split(":")[1]))) { primitive.update([]); }
      }
    }
    return { warnings, names, tables };
  }

  private pane(id: string, localPane: number) {
    if (!localPane) { return 0; }
    const key = `${id}:${localPane}`;
    if (!this.panes.has(key)) { this.panes.set(key, this.nextPane++); }
    return this.panes.get(key)!;
  }

  allocateCustomPane() { return this.nextPane++; }

  remove() {
    for (const [key, primitive] of this.primitives) { this.anchors.get(key)?.detachPrimitive(primitive); }
    this.primitives.clear(); this.anchors.clear(); this.series.clear(); this.panes.clear();
  }
}

import { describe, expect, it, vi } from "vitest";
import type { IChartApi, ISeriesApi, SeriesAttachedParameter, Time } from "lightweight-charts";
import { BuiltinRenderer } from "../../src/webview/builtinRenderer";
import { IndicatorPrimitive } from "../../src/webview/indicatorPrimitive";
import { anchor } from "../../src/indicators/pineSupport";
import type { Candle } from "../../src/marketData";

describe("public primitive integration", () => {
  it("maps prices and logical positions at paint time and clips to the pane", () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(), setLineDash: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() };
    let zoom = 10;
    const attached = { chart: { timeScale: () => ({ timeToIndex: () => 3, logicalToCoordinate: (index: number) => index * zoom }) }, series: { priceToCoordinate: (price: number) => 100 - price }, requestUpdate: vi.fn() };
    const primitive = new IndicatorPrimitive(); primitive.attached(attached as unknown as SeriesAttachedParameter<Time>);
    primitive.update([{ id: "level", kind: "segment", from: anchor(1, 20), to: anchor(4, 30), color: "#089981" }], 100 as Time);
    const target = { useMediaCoordinateSpace: (callback: (scope: unknown) => void) => callback({ context: ctx, mediaSize: { width: 300, height: 200 } }) };
    primitive.paneViews()[0].renderer()!.draw(target as never);
    expect(ctx.moveTo).toHaveBeenLastCalledWith(40, 80); expect(ctx.lineTo).toHaveBeenLastCalledWith(70, 70);
    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 300, 200); expect(ctx.clip).toHaveBeenCalled();
    zoom = 20; primitive.paneViews()[0].renderer()!.draw(target as never);
    expect(ctx.moveTo).toHaveBeenLastCalledWith(80, 80);
    primitive.detached(); expect(attached.requestUpdate).toHaveBeenCalledTimes(1);
  });

  it("reuses attachments/series and gives custom plots independent pane indices", () => {
    const attach = vi.fn(), detach = vi.fn();
    const makeSeries = () => ({ setData: vi.fn(), applyOptions: vi.fn(), attachPrimitive: attach, detachPrimitive: detach });
    const chart = { addSeries: vi.fn(makeSeries), panes: () => [{ setStretchFactor: vi.fn() }] }, candles = makeSeries();
    const renderer = new BuiltinRenderer(chart as unknown as IChartApi, candles as unknown as ISeriesApi<"Candlestick">, ["evasive-supertrend", "rsi"]);
    const bars: Candle[] = Array.from({ length: 50 }, (_, i) => ({ time: 1_704_067_200 + i * 60, open: 100, high: 101, low: 99, close: 100, volume: 10 }));
    const format = { type: "price" as const, precision: 2, minMove: 0.01 };
    renderer.update(bars, "1", format); renderer.update(bars, "1", format);
    expect(chart.addSeries).toHaveBeenCalledTimes(3); expect(attach).toHaveBeenCalledTimes(1);
    expect(renderer.allocateCustomPane()).toBe(2);
    renderer.remove(); expect(detach).toHaveBeenCalledTimes(1);
  });
});

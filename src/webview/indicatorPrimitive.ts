import type { IPrimitivePaneRenderer, IPrimitivePaneView, ISeriesApi, ISeriesPrimitive, SeriesAttachedParameter, Time } from "lightweight-charts";
import type { Anchor, IndicatorDrawing } from "../indicators/types";

/** Public Lightweight Charts primitive. No library internals or DOM overlays on the candles. */
export class IndicatorPrimitive implements ISeriesPrimitive<Time> {
  private attachedTo?: SeriesAttachedParameter<Time>;
  private drawings: IndicatorDrawing[] = [];
  private firstTime?: Time;
  private readonly view: IPrimitivePaneView = {
    zOrder: () => "normal",
    renderer: () => ({ draw: target => this.draw(target) })
  };

  attached(parameters: SeriesAttachedParameter<Time>) { this.attachedTo = parameters; }
  detached() { this.attachedTo = undefined; this.drawings = []; }
  paneViews() { return [this.view]; }
  update(drawings: IndicatorDrawing[], firstTime?: Time) {
    this.drawings = drawings;
    this.firstTime = firstTime;
    this.attachedTo?.requestUpdate();
  }

  private coordinate(anchor: Anchor): [number, number] | undefined {
    const api = this.attachedTo;
    if (!api || this.firstTime === undefined) { return; }
    const scale = api.chart.timeScale();
    const base = scale.timeToIndex(this.firstTime, true);
    const x = base === null ? null : scale.logicalToCoordinate((base + anchor.index) as Parameters<typeof scale.logicalToCoordinate>[0]);
    const y = api.series.priceToCoordinate(anchor.price);
    if (x === null || y === null || !Number.isFinite(x + y)) { return; }
    return [x, y];
  }

  private draw(target: Parameters<IPrimitivePaneRenderer["draw"]>[0]) {
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, mediaSize.width, mediaSize.height); ctx.clip();
      for (const item of this.drawings) {
        ctx.save(); ctx.strokeStyle = item.color; ctx.fillStyle = item.color; ctx.lineWidth = "width" in item ? item.width ?? 1 : 1;
        ctx.setLineDash("dash" in item ? item.dash === "dashed" ? [6, 4] : item.dash === "dotted" ? [2, 3] : [] : []);
        if (item.kind === "segment" || item.kind === "box") {
          const a = this.coordinate(item.from), b = this.coordinate(item.to);
          if (a && b) {
            if (item.kind === "segment") { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
            else {
              const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), width = Math.abs(b[0] - a[0]), height = Math.abs(b[1] - a[1]);
              ctx.fillStyle = item.fill; ctx.fillRect(x, y, width, height); ctx.strokeRect(x, y, width, height);
              if (item.text) { ctx.fillStyle = item.color; ctx.font = "10px sans-serif"; ctx.fillText(item.text, x + 4, y + 12, Math.max(1, width - 8)); }
            }
          }
        } else if (item.kind === "label") {
          const point = this.coordinate(item.at);
          if (point) {
            ctx.font = "11px sans-serif"; ctx.textAlign = "center";
            const lines = item.text.split("\n"), height = lines.length * 13 + 4;
            const y = point[1] + (item.position === "below" ? 8 : -height - 4);
            const width = Math.max(...lines.map(text => ctx.measureText(text).width)) + 8;
            if (item.background) { ctx.fillStyle = item.background; ctx.fillRect(point[0] - width / 2, y, width, height); }
            ctx.fillStyle = item.color;
            lines.forEach((text, i) => ctx.fillText(text, point[0], y + 12 + i * 13));
          }
        } else {
          const anchors = item.kind === "fill" ? [...item.top, ...item.bottom.slice().reverse()] : item.points;
          const coords = anchors.map(anchor => this.coordinate(anchor));
          if (coords.length > 1 && coords.every(point => point !== undefined)) {
            ctx.beginPath(); coords.forEach((point, i) => i ? ctx.lineTo(...point!) : ctx.moveTo(...point!));
            if (item.kind === "fill" || item.fill) {
              ctx.closePath();
              if (item.kind === "fill" && item.bottomColor) {
                const ys = coords.map(point => point![1]);
                const gradient = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys) + 0.001);
                gradient.addColorStop(0, item.color); gradient.addColorStop(1, item.bottomColor); ctx.fillStyle = gradient;
              } else { ctx.fillStyle = item.kind === "fill" ? item.color : item.fill!; }
              ctx.fill();
            } else { ctx.stroke(); }
          }
        }
        ctx.restore();
      }
      ctx.restore();
    });
  }
}

export function attachIndicatorPrimitive(series: ISeriesApi<"Candlestick" | "Line">) {
  const primitive = new IndicatorPrimitive();
  series.attachPrimitive(primitive);
  return primitive;
}

export type IndicatorPoint = { time: number; value: number };
export type IndicatorPlot = { name: string; color: string; pane: 0 | 1; type: "line" | "histogram"; data: IndicatorPoint[] };
export type BuiltinPoint = { time: number; value?: number; color?: string };
export type BuiltinPlot = {
  name: string; color: string; type: "line" | "histogram"; data: BuiltinPoint[];
  style?: "dots" | "dashed" | "dotted"; volume?: boolean; pane?: number; width?: 1 | 2 | 3 | 4;
};
/** Declarative geometry; calculations never receive a chart, DOM node or canvas. */
export type Anchor = { index: number; price: number };
type DrawingStyle = { id: string; color: string; pane?: number };
export type IndicatorDrawing = DrawingStyle & (
  | { kind: "segment"; from: Anchor; to: Anchor; width?: number; dash?: "dashed" | "dotted" }
  | { kind: "box"; from: Anchor; to: Anchor; fill: string; text?: string; dash?: "dashed" | "dotted" }
  | { kind: "label"; at: Anchor; text: string; background?: string; position?: "above" | "below"; tooltip?: string }
  | { kind: "path"; points: Anchor[]; fill?: string; width?: number }
  | { kind: "fill"; top: Anchor[]; bottom: Anchor[]; bottomColor?: string }
);
export type IndicatorTable = { title: string; rows: [string, string][] };
export type BuiltinResult = { plots: BuiltinPlot[]; drawings?: IndicatorDrawing[]; tables?: IndicatorTable[]; notice?: string };
export type IndicatorContext = {
  /** Extra closed/forming bars keyed by Binance interval (e.g. 4h/1d/1w/1m). */
  series: ReadonlyMap<string, import("../marketData").Candle[]>;
  minTick?: number;
  theme?: "dark" | "light";
};

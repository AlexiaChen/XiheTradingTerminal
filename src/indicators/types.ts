export type IndicatorPoint = { time: number; value: number };
export type IndicatorPlot = { name: string; color: string; pane: 0 | 1; type: "line" | "histogram"; data: IndicatorPoint[] };
export type BuiltinPoint = { time: number; value?: number; color?: string };
export type BuiltinPlot = {
  name: string; color: string; type: "line" | "histogram"; data: BuiltinPoint[];
  style?: "dots" | "dashed"; volume?: boolean;
};
export type BuiltinResult = { plots: BuiltinPlot[]; notice?: string };

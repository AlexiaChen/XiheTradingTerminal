import type { ChartTab } from "./chartState";

export const GRUVBOX_PALETTE = {
  up: "#83a598", down: "#d79921",
  dark: { background: "#282828", grid: "#504945", text: "#ebdbb2" },
  light: { background: "#fbf1c7", grid: "#d5c4a1", text: "#3c3836" }
};

export function widgetOptions(tab: ChartTab, containerId: string) {
  const colors = GRUVBOX_PALETTE[tab.theme];
  const { up, down } = GRUVBOX_PALETTE;
  return {
    container_id: containerId, autosize: true, symbol: tab.symbol, interval: tab.interval,
    timezone: tab.timezone, theme: tab.theme, style: "1", locale: "en",
    toolbar_bg: colors.background, backgroundColor: colors.background, gridColor: colors.grid,
    hide_side_toolbar: false, hide_volume: true, allow_symbol_change: true,
    studies: tab.studies,
    overrides: {
      "paneProperties.backgroundType": "solid", "paneProperties.background": colors.background,
      "paneProperties.vertGridProperties.color": colors.grid, "paneProperties.horzGridProperties.color": colors.grid,
      "scalesProperties.textColor": colors.text, "scalesProperties.lineColor": colors.grid,
      "mainSeriesProperties.candleStyle.upColor": up, "mainSeriesProperties.candleStyle.downColor": down,
      "mainSeriesProperties.candleStyle.borderUpColor": up, "mainSeriesProperties.candleStyle.borderDownColor": down,
      "mainSeriesProperties.candleStyle.wickUpColor": up, "mainSeriesProperties.candleStyle.wickDownColor": down
    },
    studies_overrides: {
      "volume.volume.color.0": down, "volume.volume.color.1": up,
      "moving average.length": 90,
      "zigzag.deviation (%)": 5, "zigzag.depth": 10
    }
  };
}

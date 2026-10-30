# K 线周期

工具栏支持请求 1m/5m/15m/30m/1h/4h/6h/8h/1D/1W，对应 1/5/15/30/60/240/360/480/D/W 字符串。默认 4H（240）。

选项 HTML 在 src/tradingViewProvider.ts；前端 change 事件在 src/webview/main.ts 更新当前标签并保存，theme.ts/widgetOptions 将 interval 原样传给官方 widget。

**2026-10-29 的真实外部验证修正了初次离线结论**：对 BINANCE:SOLUSDT 请求 360 或 480 后，iframe 加载完成均回退到 1 day。离线参数和状态测试通过不代表真实 6h/8h K 线支持。当前对这些选项显示明确提示，真实支持仍未完成。

参考 [TradingView resolution 编码](https://www.tradingview.com/charting-library-docs/latest/ui_elements/Resolution/)，但不要把独立图表库的全部能力套用到托管 widget 上。

0.0.3 本地引擎将 360/480 映射 Binance 原生 6h/8h。2026-10-30 ETHUSDT 实际 HTTP 200，相邻开盘差 21,600/28,800 秒。上述日线回退限制和提示仅针对 Widget；本地无需该警告。详见[双引擎](chart-engines.md)。

## 1.0.0覆盖说明

两图同时展示后，预览跟随Widget实际报告周期。Binance REST已移除；0.0.3独立原生6h/8h的历史证据不再代表当前路径。保留Widget回退提示；有效周期未确认时明确显示跟随Settings，确认后显示实际标的/周期。主图选择预览不支持的周期时显示错误，不继续冒充旧周期。

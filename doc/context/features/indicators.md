# 默认指标与持久化边界

每次创建图表必须带 ZigZag（偏差 5%、深度 10）和简单移动平均 MA(90)。

- study ID：ZigZag@tv-basicstudies、MASimple@tv-basicstudies。
- studies_overrides：`zigzag.deviation (%)=5`、`zigzag.depth=10`、`moving average.length=90`。
- REQUIRED_STUDIES / normalizeStudies 位于 src/chartState.ts；widget 参数位于 src/theme.ts。
- 插件 Additional indicators 输入框仅编辑额外 study，默认指标始终补入；旧版本已保存的 Volume/RSI 等额外数据保留。
- 新图表隐藏 widget 自动成交量，用户显式保存的额外 Volume study 不删除。

2026-10-30 真实托管图表预览中已观察到 MA 90 close、Zigzag 5 10 的图例。进一步将偏差临时改为 7，真实图例随之显示 7，恢复为 5 后再截图；确认参数名是 `deviation (%)`，原先 `deviation` 会被忽略并警告。

切换图表/工作区保留 iframe 实例，因此用户直接在 TradingView 图表中增加或调整的指标能在本次会话切换后继续存在。完整重载/重启及插件工具栏图表参数变化会重建实例，恢复默认指标和已保存额外 study；本项目未获得托管 widget 的完整布局导出 API，不能保证这种情况下恢复图表内部编辑。

默认配置不是对跨域图表内部按钮的强制锁定；用户在图表内部仍能移除或修改它们，重建时再应用插件默认值。社区 Pine Script 仍不受支持。

# 项目概览

XiheTradingTerminal 是 VS Code 中的图表工作台。每个 VS Code 工程保存独立的插件配置；插件内部还支持多个命名的图表工作区，每个工作区包含多个 Chart 标签。

当前支持工作区创建/重命名/切换/删除、Chart 添加/重命名/切换/关闭、symbol/interval/额外指标/明暗主题配置与设置栏折叠。默认 symbol 为 BINANCE:ETHUSDT、4H、UTC、Gruvbox Dark，Settings 默认折叠，指标为 ZigZag(5%, 10) 和简单 MA(90)。

1.0.0同时显示托管Widget主图和官方Lightweight Charts 5.2.1指标预览；宽屏并排，窄栏上下。扩展宿主匿名订阅Widget同一行情服务，支持服务允许的美股等市场和crypto，显示实际源/延迟；已删除Binance REST。预览跟随主图消息报告的实际标的/周期，保留JS Worker和43项可选预设。没有Pine执行器或下单，未引入Advanced Charts库。Widget 6h/8h若回退，预览跟随有效周期；详见[双图架构](../features/chart-engines.md)和[单指标展示](../../built-in-indicator-showcase.md)。

技术栈为 Vite 8、Tailwind CSS 4、TypeScript 6、Vitest 5、ESLint 10；本地 vsce 负责 VSIX 打包。用户介绍与截图见 [README](../../../README.md)，开发入口见 [package.json](../../../package.json)。

0.0.4 本地图表增加13项可选内建 JS 预设及按 Chart 保存的选择列表。公式与目录见[内建指标](../features/builtin-indicators.md)，用户指定每个指标独立 TS 文件。Fib 仅量最新 ZigZag 波段的0–100%回撤，不含扩展和方向预测。

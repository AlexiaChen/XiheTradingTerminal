# 项目概览

XiheTradingTerminal 是 VS Code 中的图表工作台。每个 VS Code 工程保存独立的插件配置；插件内部还支持多个命名的图表工作区，每个工作区包含多个 Chart 标签。

当前支持工作区创建/重命名/切换/删除、Chart 添加/重命名/切换/关闭、symbol/interval/额外指标/明暗主题配置与设置栏折叠。默认 symbol 为 BINANCE:ETHUSDT、4H、UTC、Gruvbox Dark，Settings 默认折叠，指标为 ZigZag(5%, 10) 和简单 MA(90)。

双引擎通过独立 Tab 切换：tv.js 创建托管 Widget，由 TradingView 提供行情；官方开源 Lightweight Charts 5.2.1 本地渲染 Binance 公开现货 K 线，支持 JS Worker 指标。默认仍为 Widget。没有 Pine 执行器或下单。Widget 6h/8h 仍可能回退日线，本地可用原生 6h/8h；详见[双引擎](../features/chart-engines.md)。

技术栈为 Vite 8、Tailwind CSS 4、TypeScript 6、Vitest 5、ESLint 10；本地 vsce 负责 VSIX 打包。用户介绍与截图见 [README](../../../README.md)，开发入口见 [package.json](../../../package.json)。

0.0.4 本地图表增加13项可选内建 JS 预设及按 Chart 保存的选择列表。公式与目录见[内建指标](../features/builtin-indicators.md)，用户指定每个指标独立 TS 文件。Fib 仅量最新 ZigZag 波段的0–100%回撤，不含扩展和方向预测。

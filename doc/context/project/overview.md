# 项目概览

XiheTradingTerminal 是 VS Code 中的图表工作台。每个 VS Code 工程保存独立的插件配置；插件内部还支持多个命名的图表工作区，每个工作区包含多个 Chart 标签。

当前支持工作区创建/重命名/切换/删除、Chart 添加/重命名/切换/关闭、symbol/interval/额外指标/明暗主题配置与设置栏折叠。默认 symbol 为 BINANCE:ETHUSDT、4H、UTC、Gruvbox Dark，Settings 默认折叠，指标为 ZigZag(5%, 10) 和简单 MA(90)。

官方 tv.js 创建托管图表，行情由 TradingView 提供。本项目没有行情下载、K 线聚合、Pine 执行器或交易下单功能。6h/8h 存在真实托管图表回退日线的限制。

技术栈为 Vite 8、Tailwind CSS 4、TypeScript 6、Vitest 5、ESLint 10；本地 vsce 负责 VSIX 打包。用户介绍与截图见 [README](../../../README.md)，开发入口见 [package.json](../../../package.json)。

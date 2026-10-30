# 双图表引擎与开源选型

## 2026-10-30 选型

用户要求主流开源、JS 指标和两个独立切换 Tab，保留原有配置和配色。

| 候选 | 当次官方 GitHub 信息 | 适用情况 |
| --- | --- | --- |
| TradingView Lightweight Charts | 约 17,713 stars；5.2.1；Apache 2.0；官方维护 | 专门的金融 Canvas 图表，有扩展接口，选用 |
| Apache ECharts | 约 67,627 stars；Apache 2.0 | 主流通用可视化，支持蜡烛图，但金融交互和指标需搭建 |
| KLineChart | 约 4.3k stars；Apache 2.0；内置指标和画线 | 也可用，生态较小；用户最终明确选 TradingView 开源库 |

星数为调研快照。来源：[Lightweight Charts API](https://api.github.com/repos/tradingview/lightweight-charts)、[ECharts API](https://api.github.com/repos/apache/echarts)、[KLineChart](https://github.com/klinecharts/KLineChart)。只引入 lightweight-charts，无第三方封装。

## Advanced Charts

托管 Widget 不支持本地或社区 Pine 脚本。Advanced Charts 支持 JS `custom_indicators_getter`，但也不运行 Pine Script；库在私有仓库，需要申请授权，标准授权不提供个人/业余/学习测试用途，不可公开再分发。用户因此选择 Lightweight Charts；项目不含 Advanced Charts 库或未验证的接口替身。

官方资料：[Widget FAQ](https://www.tradingview.com/widget-docs/faq/general/)、[JS 自定义指标](https://www.tradingview.com/charting-library-docs/latest/custom_studies/)、[授权流程](https://www.tradingview.com/charting-library-docs/latest/quick-start/)、[个人限制](https://www.tradingview.com/free-charting-libraries/)。

## 生命周期和行情

Chart 增加 `engine: widget | lightweight`（旧数据默认 widget）、`customIndicators[]: id/name/source`。ChartCache 身份为 `[workspaceId, tabId, engine]`，两种引擎分别保留实例；重命名、折叠、切换不销毁，共同配置变化在对应实例下次显示时生效，JS 源码只影响本地引擎。

默认 ETHUSDT/4H、Settings 折叠、雾蓝涨/麦黄跌、MA90/ZigZag5%,10 保持。旧 SOL 名称和交易对不覆盖；+ Workspace 使用新默认。Widget 脚本异步加载，15 秒超时，窄栏可见错误；Retry Chart 只重建当前引擎，丢弃该实例未保存内部编辑。iframe 创建不等于远程行情加载成功。

本地使用 `https://data-api.binance.vision/api/v3/klines` 公开现货接口，无账号/密钥或交易。仅支持 BINANCE 现货，不隐式替换其他市场/永续合约。初始最近 1,000 条；可见时每 15 秒取最近两条，隐藏时取消请求/Worker并停止轮询，返回后取完整最近 1,000 条补齐间隙。时间为 UTC，非无限历史；失败不生成模拟数据。

2026-10-30 ETHUSDT 6h/8h 实际 HTTP 200，相邻开盘差 21,600/28,800 秒。Widget 日线回退限制仍只对 Widget 提示。[API 文档](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)。

本地 MA 为简单 90 期均线；ZigZag 为半深度对称窗口极值加 5% 反转过滤，存在确认延迟，最新极值可修正，不保证与托管指标逐点一致。额外支持 Volume、RSI14；其他 study 保留并提示 Widget-only。

## 本地 JS

内建扩展已单独接入公开 primitives 绘图、分类预设及辅助 HTF/LTF 数据，见 [Pine 分类及指南](pine-indicators.md)。下面的8 plot /2秒限制仅针对用户选取的JS文件；内建富图形不是给外部脚本开放原始图表接口。

从可信工程主动选择 .js，最多 8 个、每个 64KiB；保存源码快照，不自动监控文件。定义顶层 `calculate(bars)` 返回最多 8 个 plot：name/color/data，可选 type=line|histogram、pane=0|1；点须有限、有序且对应已有 K 线时间。

独立 Blob Worker 解析源码，无 eval/Function，无 Webview DOM/VS Code API；两秒 terminate，隐藏/关闭取消。保持 nonce CSP，仅增加 Binance connect-src 和 blob worker-src，不放开 unsafe-eval。无 import、Node API 或 Pine Script。示例 examples/indicators/ema-20.js；契约见英文 README。

第三方许可证随 VSIX 分发，归属链接保留。离线测试、浏览器真实 Canvas/Worker/API、真实 VS Code 宿主及远程 CI 分开记录。

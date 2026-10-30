# 托管 Widget 行情桥接调研

## 后续工程结论：1.0.0已接入插件

后续实验确认无需常驻Chromium/CDP：扩展宿主可以匿名连接Widget同一行情服务，使用观察到的协议建立只读主/辅助周期订阅。已集成于 `src/marketData/widgetFeed.ts`、`widgetProtocol.ts`，由provider管理可见性/订阅生命周期，通过Webview消息送给同时展示的Lightweight预览。不是对实际iframe socket的监听或官方数据API；两条独立连接的更新可能略有时间差。以下最初快照记录仅作历史证据，其“未接入产品/需伴随浏览器”判断已被新实验取代。

原生实验取得ETH/4H连续增量，AAPL/日线及MSFT/1H实际解析Cboe One的BATS_DLY来源、延迟900秒；MSFT辅助5m实际返回5304根。主动断开宿主socket后保留旧图并重载1000根。真实Widget内部改1H、改MSFT时预览跟随，iframe身份保持。后续分类截图中ETH/5m的1m delta达到1000/1000覆盖；Profile Nodes在4H遇到子周期缺口时省略，改5m验证完整窗口。

产品不再调用Binance REST，当前数据授权和内部协议稳定性边界仍保留。浏览器验证使用真实扩展构建+VS Code API预览替身，不能当成真实宿主或远程CI。

## 结论与范围

2026-10-30，基于干净的 `67423e0` checkout、重新构建的 Webview、agent-browser Chromium 和 VS Code API 预览替身开展调研。**浏览器调试层可以观察到托管 Widget 收到的历史 OHLCV 和增量消息；取出的美股快照可以驱动当前项目的本地指标和 Lightweight Charts。** 尚未接入扩展产品或实现持续同步。

普通 Webview 父页面不能直接读取跨域 iframe。浏览器自动化的调试权限不能当成已安装扩展自动拥有的能力。本次未下载或启动 VS Code，没有真实宿主、用户主机、远程 CI 或所有市场覆盖证据。

## 官方接口和产品区别

- [Widget Data FAQ](https://www.tradingview.com/widget-docs/faq/data/) 明确没有提供行情/指标数据 API，也不支持从 Widget 导出。
- 同一 FAQ 明确 Widget 可显示市场受限制；主站可用的标的可能不允许嵌入，股票可能延迟，购买主站套餐不会升级 Widget 行情。
- [Supercharts 的 CSV 导出](https://www.tradingview.com/support/solutions/43000537255-how-to-export-chart-data/) 属于主站图表功能，不能据此认为 Widget 有导出入口。自行导出后导入本地是另一条快照预览路线；当前扩展尚无 CSV 导入功能。
- [Advanced Charts 的 exportData](https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.IChartWidgetApi/#exportdata) 属于另一个库。当前 `tv.js` Widget 原型实测没有 `activeChart` / `exportData`。

## 浏览器实测

使用当前项目的选项和构建产物，在 `http://127.0.0.1:8765` 加载预览，保留 nonce CSP，通过 agent-browser 操作 Settings 更换标的/周期。初次 about:blank 加载曾白屏，最终结论采用有明确 origin 且真实 K 线可见的 localhost 页面。

| 路径 | 实测结果 | 历史指标所需数据 |
| --- | --- | --- |
| 父页面读取 `iframe.contentWindow.document` | `SecurityError`；`contentDocument` 为 null | 不能直接使用 |
| Widget `getSymbolInfo` 对应消息 | 名称、实际交易所、类型和周期 | 只有元信息 |
| Widget `subscribeToQuote` 对应消息 | 最新价、涨跌额/幅、总成交量和实际代码 | 缺少逐根历史 OHLCV |
| 浏览器 CDP WebSocket 接收事件 | 历史序列与最新 K 线更新 | 技术验证通过；依赖调试权限及未公开协议 |
| DOM/截图提取 | 父页面无权读取内部 DOM；没有尝试 OCR | 没有证明能精确恢复 OHLCV |

`tv.js` 确实包含 `getSymbolInfo` 和 `subscribeToQuote` 包装方法。调研对实际 iframe 发送这些方法使用的 `postMessageWrapper` 请求，没有向远程 iframe 注入 DOM 或改写图表。约159秒窗口内收到 `tv-widget-load`、`widgetReady`、`symbolInfo`、`quoteUpdate`，quote回调收到5条消息。AAPL最新价348.91、总成交量42582126，不包含历史开高低收或逐根时间，不能据此构造已有历史或精确的其他周期K线。这些包装方法不是有稳定行情契约的官方OHLCV API。

另用Node.js 24的WebSocket连接agent-browser创建的Chromium CDP，只读监听 `Network.webSocketFrameReceived`，观察正常Widget加载的流量。没有重放私有服务请求、代入账号或绕过市场权限。

| 请求 | 实际解析标的 | 已观察历史 | 增量证据 |
| --- | --- | --- | --- |
| `BINANCE:ETHUSDT` / `240` | `BINANCE:ETHUSDT` | 300根4H，时间、OHLCV齐全 | 多次更新最后一根的收盘价及成交量 |
| `NASDAQ:AAPL` / `D` | **`BATS_DLY:AAPL`，Cboe One** | 300根日K，时间、OHLCV齐全 | 获得quote消息；未证明开市中的连续K线更新 |

连接位于 `widgetdata.tradingview.com`。接收帧出现 `symbol_resolved`、`timescale_update`、`du`；主序列包含索引和六个数值 `[time, open, high, low, close, volume]`。这是观察到的内部协议，不是兼容性保证。300根是此次默认加载结果，不是稳定历史上限；未验证向左翻页完整历史、断线补齐或所有周期。

AAPL最后一根快照：时间1793280600，开348.00，高351.43，低347.30，收348.91，量42582126。源元信息为 `America/New_York`、常规时段 `0930-1600`。请求NASDAQ与实际Cboe One必须分开记录，不能标成NASDAQ全市场实时行情。

## Lightweight 和本地指标验证

将AAPL主序列转换为现有 `Candle[]`，检查300条时间升序唯一、OHLC关系及非负成交量。在 `/tmp` 构建独立研究页，复用当前源码：

- Lightweight Charts 5.2.1、`simpleMovingAverage.ts`、`zigzag.ts`；
- `BuiltinRenderer` 的 RSI 和 Evasive SuperTrend，包括公开primitive绘图；
- `indicatorRunner.ts` 和 `examples/indicators/ema-20.js`，真实Blob Worker运算。

成功渲染300根AAPL日K、211个MA90点、ZigZag、RSI、Evasive SuperTrend及300个EMA20点；内建warnings为空，浏览器无运行错误。研究页只从localhost读取快照和JS示例，没有另接Binance或其他市场API。

这是**快照回放的端到端验证**。ETH流证明可观察增量，但尚未持续送入研究页，正式扩展仍使用原Binance行情路径。

临时脚本：`/tmp/tv-data-observer.mjs`、`/tmp/tv-data-proof.ts`、`/tmp/tv-data-proof-build.mjs`；接收记录：`/tmp/tv-data-observation.jsonl`；研究页与快照：`/tmp/tv-data-research/`。截图：`/tmp/tv-data-widget-localhost.png`、`/tmp/tv-data-widget-aapl.png`、`/tmp/tv-data-lightweight-aapl-proof.png`。临时文件不是仓库内可复现的正式实现，不随VSIX分发。

## 工程判断与未验证项

有依据的探索路径：用户控制的浏览器加载Widget → 本地伴随进程通过CDP观察接收帧 → 区分会话、实际标的与周期，规范化OHLCV → 扩展消息传递 → Lightweight及指标计算。CDP事件是[浏览器公开调试能力](https://chromedevtools.github.io/devtools-protocol/tot/Network/)，行情消息格式则不是公开数据API。

这减少逐市场接入数据商的工作，但仍在维护以TradingView为来源的行情适配器，还增加浏览器生命周期和调试连接。[VS Code Webview接口](https://code.visualstudio.com/api/extension-guides/webview)提供页面和扩展间消息传递，尚未验证普通扩展能直接监听其嵌入Widget的网络帧。不能用浏览器PoC证明现有View层可透明部署。

工程化还需解决：实际来源/有效周期、时区/交易时段/复权/精度；初始历史、同根更新、会话切换、缓存、重连补齐及缺失；浏览器/内部协议变化和远程宿主连接。单个主周期Widget数据不足以支持所有HTF/LTF指标，不能静默用Binance拼接美股辅助流。

[TradingView条款第3节](https://www.tradingview.com/policies/)对数据展示、处理和再利用设有限制。可观察流量不是自动获得外部计算或再利用授权的证据；本次不作法律许可结论。

偶尔预览非crypto标的，可考虑自行导出Supercharts CSV后增加本地导入入口；自动连续同步则需另行工程验证上述CDP伴随进程路线。

# 扩展与前端架构

```text
src/extension.ts → Vite CJS → out/extension.js
  └── TradingViewProvider
      ├── getHtml(): 注入规范化初始状态、nonce、Webview 资源 URI
      ├── 注入 Workspace Trust 标志，处理用户主动选择的 JS 文件
      ├── 加载 out/webview.js 与 out/webview.css
      ├── persist 消息 → normalizeState → workspaceState.update
      └── 删除工作区确认 → VS Code 模态确认 → removeWorkspace 消息

src/webview/main.ts → Vite IIFE → out/webview.js
  ├── chartState.ts: 与宿主共用状态规范化和默认值
  ├── styles.css → Tailwind Vite 插件 → out/webview.css
  ├── ChartCache: 按工作区/图表/引擎 ID 缓存实例
  ├── widgetLoader.ts → 异步 tv.js → new TradingView.widget
  └── lightweightChart.ts ↔ previewFeed.ts ↔ Provider / WidgetFeed → 本地 Canvas / 指标 Worker
```

视图 ID 为 `xihe-trading-terminal.sidebar`，Activity Bar 容器 ID 为 `xihe-trading-terminal`，重载命令为 `xihe-trading-terminal.reload`。隐藏 Webview 时保留上下文。

图表缓存按 `(workspaceId, tabId, engine)` 区分实例，symbol/interval/studies/theme/timezone 变化时才重建对应实例，本地引擎还比较 JS 配置。名称、当前选择和折叠状态不参与配置指纹。未激活图表通过 hidden 隐藏；关闭图表/工作区时清理相关 DOM 和可用的 widget remove 方法。保留实例会增加打开过的图表占用，当前不做会导致状态丢失的自动淘汰。

安全策略默认拒绝所有资源；本地 JS 使用 nonce 和 Webview 资源源，远程脚本仅允许 s3.tradingview.com，样式使用本地构建产物，frame 仅允许 TradingView 域。注入 JSON 转义 `<`，名称通过 textContent 渲染。

1.0.0的Webview行情通过宿主消息获取，connect-src为none、worker-src仅blob:，无unsafe-eval。扩展宿主使用匿名Widget WS连接。文件选择要求可信工程并限制大小，源码快照由Worker计算；拒绝iframe来源的宿主协议消息。隐藏预览取消订阅和Worker，恢复后重载历史。

1.0.1修正宿主消息来源校验：用户安装的VS Code Webview实现通过外层同源frame的`contentWindow.postMessage`转发消息，其注入脚本同时遮蔽`window.parent`。因此`event.source === window`不成立，旧判断会丢弃行情、恢复、JS导入及删除确认消息。现在共用`hostMessages.ts`，按`event.origin === window.origin`接收宿主同源消息，拒绝TradingView跨源frame；订阅ID仍隔离旧消息。测试使用非self来源和显式origin，不能再只用无source/origin的合成事件冒充真实宿主。

扩展激活时创建`XiheTradingTerminal` LogOutputChannel，并由context释放；Provider注入logger，记录宿主平台/版本/remote、代理来源及去凭据地址、订阅生命周期、历史快照及投递失败。WidgetFeed记录连接、错误码/HTTP状态/握手超时和退避，不记录原始transport错误或代理userinfo。前端按订阅/流首次确认`received`，首次完整计算/数据提交确认`rendered`；后者不是GPU完成或真实宿主安装证明。渲染错误去重后上报，初始化错误单列在Preview旁，文本有长度和URL脱敏限制。不会逐根K线写日志。

## 1.0.0 宿主行情

Provider管理一个活跃WidgetFeed，验证请求ID/标的/周期，处理previewSubscribe/Stop，隐藏或释放时关闭。旧回调在feedId变化后不能向新图发送事件。WS传输、代理、心跳、帧和序列解码位于marketData，Webview只接收受控消息；CSP connect-src为none。主图观察通过tv.js消息接口，保持跨域隔离，主图和预览分开缓存。两图的symbol/interval联动，平移、十字线和画线独立。

Widget的quoteUpdate回调在tv.js中跨实例共享；当前实现恢复缓存主图时重新订阅，隐藏实例迟到的ready不抢占回调，并按ticker和交易所分别缓存报价，防止其他隐藏Widget污染实际源。对应离线回归及真实AAPL往返后修改MSFT/1H验证通过。

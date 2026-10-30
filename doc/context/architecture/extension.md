# 扩展与前端架构

```text
src/extension.ts → Vite CJS → out/extension.js
  └── TradingViewProvider
      ├── getHtml(): 注入规范化初始状态、nonce、Webview 资源 URI
      ├── 加载官方 tv.js
      ├── 加载 out/webview.js 与 out/webview.css
      ├── persist 消息 → normalizeState → workspaceState.update
      └── 删除工作区确认 → VS Code 模态确认 → removeWorkspace 消息

src/webview/main.ts → Vite IIFE → out/webview.js
  ├── chartState.ts: 与宿主共用状态规范化和默认值
  ├── styles.css → Tailwind Vite 插件 → out/webview.css
  ├── ChartCache: 按工作区/图表 ID 缓存实例
  └── theme.ts/widgetOptions → new TradingView.widget
```

视图 ID 为 `xihe-trading-terminal.sidebar`，Activity Bar 容器 ID 为 `xihe-trading-terminal`，重载命令为 `xihe-trading-terminal.reload`。隐藏 Webview 时保留上下文。

图表缓存按 `(workspaceId, tabId)` 区分实例，只有 symbol/interval/studies/theme/timezone 变化时才重建对应实例。名称、当前选择和折叠状态不参与配置指纹。未激活图表通过 hidden 隐藏；关闭图表/工作区时清理相关 DOM 和可用的 widget remove 方法。保留实例会增加打开过的图表占用，当前不做会导致状态丢失的自动淘汰。

安全策略默认拒绝所有资源；本地 JS 使用 nonce 和 Webview 资源源，远程脚本仅允许 s3.tradingview.com，样式使用本地构建产物，frame 仅允许 TradingView 域。注入 JSON 转义 `<`，名称通过 textContent 渲染。

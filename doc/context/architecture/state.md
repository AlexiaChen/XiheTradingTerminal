# 状态与迁移

状态键为 `xihe-trading-terminal.state`，读取时兼容同一存储范围内的旧键 `tradingview.state`，存储在 VS Code `workspaceState`，不是全局设置。

```text
TradingViewState
├── workspaces[]
│   ├── id, name
│   ├── tabs[]: id, name, symbol, interval, studies[], theme, timezone, engine, localIndicators[]
│   │   └── customIndicators[]: id, name, source
│   └── activeTabId
├── activeWorkspaceId
└── ui.isToolbarCollapsed
```

`src/chartState.ts` 的 normalizeState 同时用于宿主读取、消息保存和前端恢复。旧顶层 tabs/activeTabId 自动迁入 Workspace 1，保留原标签及额外指标。缺省或无效结构恢复默认，重复 ID 被去重，无效选择回退首项，每个工作区至少一个标签。

normalizeStudies 始终补充 ZigZag 和 MASimple，并保留合法额外 study ID。主题仍使用 dark/light；周期数字转换为字符串。

前端优先 `vscode.getState()`，否则使用宿主注入状态；persist 同时 setState 与 postMessage，宿主再次规范化并写入 Memento。切换工作区或标签立即保存当前选择。

这个状态不包含 TradingView iframe 内的完整指标/绘图布局。通过实例复用保持的会话内编辑，与可关闭重开恢复的插件配置，是不同的保存边界。

插件重命名后 ID 为 AlexiaChen.xihe-trading-terminal，VS Code 对不同插件 ID 的 Memento 隔离；上述键兼容不等于能够跨插件 ID 导入上游扩展的数据。

0.0.4 的 localIndicators[] 仅控制本地图表预设；无该字段时从旧 Volume/RSI 迁移，显式空数组不回填。未知 ID 过滤、重复项去重、按目录稳定排序。复制 Chart 时克隆数组，互不影响；Widget 的 studies 和缓存保持独立。

旧状态 engine 默认为 widget，customIndicators 为空；引擎选择和 JS 源码快照可恢复，数量和 UTF-8 字节大小受限制。已有 SOLUSDT 标签和显式参数不覆盖，重装同 ID 插件可能恢复 Memento；新建 Workspace 使用 ETH/4H 默认。

## 1.0.0 同时展示兼容

保留旧engine值和全部workspace/chart/指标字段，但界面同时显示widget和lightweight；不再据engine隐藏任一图。Widget内部选择只在会话运行态following映射中记录，不覆盖用户显式保存的Settings；重载仍使用保存配置，不承诺完整Widget布局恢复。

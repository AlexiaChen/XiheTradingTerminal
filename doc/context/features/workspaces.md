# 图表工作区与标签

Workspace 指插件内部的图表分组，用户已明确选择这种含义，不是重命名 VS Code 工程。

工作区下拉切换，+ Workspace 创建默认图表并弹出命名表单，Rename 修改名称。Remove 通过 VS Code 宿主确认后移除工作区及其图表，至少保留一个。

+ Chart 复制当前标签的插件配置，使用新 ID；铅笔按钮或双击标签名称可重命名，关闭后清理对应缓存，至少保留一张图表。

前端命名表单支持保存、取消、Escape、焦点返回和 Tab 循环。名称采用文本节点显示，不拼入 HTML。

关键实现：`src/webview/main.ts`、`chartCache.ts`、`src/chartState.ts`。切换与重命名不重建 widget，这是保留 TradingView 内部指标配置的关键。

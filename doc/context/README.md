# 项目上下文索引

本目录记录当前代码结构、行为约束和验证证据。README 面向用户并保持英文，这里的上下文以中文维护。

```text
doc/context/
├── README.md
├── project/
│   ├── overview.md
│   └── progress.md
├── architecture/
│   ├── extension.md
│   └── state.md
├── features/
│   ├── workspaces.md
│   ├── indicators.md
│   ├── intervals.md
│   ├── theme.md
│   ├── chart-engines.md
│   ├── builtin-indicators.md
│   └── pine-indicators.md
├── development/
│   ├── toolchain.md
│   └── validation.md
└── research/
    └── widget-data-bridge.md
```

- 项目：[概览](project/overview.md)、[进度与验证边界](project/progress.md)
- 架构：[扩展和前端](architecture/extension.md)、[状态及迁移](architecture/state.md)
- 功能：[工作区与标签](features/workspaces.md)、[默认指标](features/indicators.md)、[周期](features/intervals.md)、[Gruvbox](features/theme.md)
- 双引擎：[开源选型、行情和本地 JS 指标](features/chart-engines.md)
- 内建指标：[独立 TS 目录、公式、斐波那契回撤与保存](features/builtin-indicators.md)
- Pine 移植：[分类目录、低侵入绘图、叠加指南、数据和许可边界](features/pine-indicators.md)
- 开发：[工具链选择](development/toolchain.md)、[验证、打包与 CI](development/validation.md)
- 展示：[Built-in Indicator Showcase](../built-in-indicator-showcase.md)（Pine衍生逐个截图、传统指标示例）
- 调研：[托管 Widget 行情桥接实测及1.0.0接入演进](research/widget-data-bridge.md)

协作约定见 [AGENTS.md](../../AGENTS.md)。新增上下文按主题归档并更新索引；旧结论被新证据推翻时应明确修正。

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
│   └── theme.md
└── development/
    ├── toolchain.md
    └── validation.md
```

- 项目：[概览](project/overview.md)、[进度与验证边界](project/progress.md)
- 架构：[扩展和前端](architecture/extension.md)、[状态及迁移](architecture/state.md)
- 功能：[工作区与标签](features/workspaces.md)、[默认指标](features/indicators.md)、[周期](features/intervals.md)、[Gruvbox](features/theme.md)
- 开发：[工具链选择](development/toolchain.md)、[验证、打包与 CI](development/validation.md)

协作约定见 [AGENTS.md](../../AGENTS.md)。新增上下文按主题归档并更新索引；旧结论被新证据推翻时应明确修正。

# 项目协作约定

## 开始工作

- 阅读 [上下文索引](doc/context/README.md) 和 [当前进度](doc/context/project/progress.md)，检查 `git status --short`，保留用户已有改动。
- 当前源码与实际验证结果是依据；改动功能、架构或开发流程时，同步更新相关 `doc/context`、README 和 CHANGELOG。
- README 保持英文，`doc/context` 可以使用中文。默认不提交、不推送、不发布；用户明确要求时按授权执行。

## 项目结构

- `src/extension.ts`：VS Code 激活、视图注册和重载命令。
- `src/tradingViewProvider.ts`：Webview HTML、安全策略、宿主消息与 workspaceState。
- `src/chartState.ts`：共享类型、规范化、默认指标及旧状态迁移。
- `src/theme.ts`：Gruvbox 配色与 TradingView widget 参数。
- `src/webview/main.ts`、`chartCache.ts`：前端交互、命名工作区和图表实例生命周期。
- `src/webview/lightweightChart.ts`、`src/marketData.ts`、`src/indicators.ts`：本地图表、Binance 公开现货数据和默认指标。
- `src/webview/indicatorRunner.ts`：本地 JS Worker（2 秒超时、无 eval）；`widgetLoader.ts`：托管库异步加载与失败重试。
- `src/webview/styles.css`：Tailwind CSS 4 主题变量和组件样式；不要另建平行的手写布局体系。
- `vite.config.mts`：扩展 CJS 和 Webview IIFE/CSS 两个构建模式。
- `test/`：Vitest 离线回归测试；`.github/workflows/ci.yml`：CI。

## 行为约束

- 保持已有工作区数据兼容。原先 `{ tabs, activeTabId, ui }` 迁移为一个命名工作区；保留用户已有额外指标。
- 新工作区默认 BINANCE:ETHUSDT、4H，Settings 默认折叠；显式保存的旧配置不强制覆盖。
- 默认必须包含 ZigZag（偏差 5%、深度 10）和简单 MA(90)。附加指标编辑不能移除这些默认配置。
- 切换 Chart / Workspace、重命名和折叠工具栏时复用原 widget；不能通过销毁重建来切换，否则图表内部的指标编辑会丢失。
- 修改图表配置时可以重建对应实例；完整重载/重启无法恢复 widget 内部未通过插件工具栏保存的编辑，不能宣称支持完整图表布局保存。
- 6h/8h 请求值为 `360`/`480`，但已观察到托管 widget 回退到日线；保持可见提示，不宣称已实现真实周期。
- 托管 widget 不支持社区 Pine 脚本。不要将 Advanced Charts 的完整 API 直接当作本项目可用接口。
- 第二引擎为官方开源 Lightweight Charts，使用独立切换 Tab；按 workspace/chart/engine 缓存实例。保留旧状态，默认 widget。
- 本地仅支持 BINANCE 现货、UTC、最近 1,000 根；6h/8h 原生请求，Widget 的周期回退提示只对 Widget 生效。隐藏/失败后恢复须补齐历史。
- JS 指标只在可信工程中由用户选文件；保存源快照，Worker 计算并验证输出、超时和取消。不可宣称 Pine Script 或完整画线工具支持；第三方许可证随包分发。
- 保留 nonce CSP、初始 JSON 的 `<` 转义和文本节点渲染；不通过跨域 DOM 注入来修改图表。
- Gruvbox 默认雾蓝涨、麦黄跌，参考相邻 `kline-trainer` 的实际源码。

## 构建与交付

- 开发使用 Node.js 24；扩展目标 Node.js 22 / ES2024，`@types/vscode` 与最低 VS Code 1.108.1 对齐。
- `npm install` 安装本地工具；`npm ci` 安装锁定工具。不要全局安装打包器。
- `npm test` 执行 lint、类型检查、Vite 构建和回归测试。按用户明确要求，不下载 VS Code，不执行宿主烟测。
- `npm run package` 通过本地 vsce 构建并生成 `dist/*.vsix`，不能隐式运行测试。构建、测试和打包应能分别运行。
- `node_modules/`、`out/`、`dist/`、VSIX 与 `.vscode-test/` 均不跟踪；只提交源码、锁文件、配置、文档和截图。不要重新加入生成物。
- 检查 `git diff --check`、VSIX 实际文件内容和文档链接。测试、编译、打包结果不能代替远程 CI 成功。
- 最终截图应来自当前构建；区分浏览器中真实 widget + VS Code API 替身、真实扩展宿主，以及用户宿主机安装。

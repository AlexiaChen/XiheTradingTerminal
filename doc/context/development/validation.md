# 测试、打包与 CI

## 本地命令

```bash
npm install
npm run build
npm test
npm run package
python3 scripts/verify_vsix.py
git diff --check
```

npm ci 用于从锁文件安装；npm install 满足日常本地安装。打包工具是本地 devDependency，无需全局 vsce。package 通过 vsce 的 vscode:prepublish 运行 build，不运行测试；输出 dist/xihe-trading-terminal-1.0.1.vsix。

build 先 tsc --noEmit，再 Vite 构建扩展 CJS 与 Webview IIFE/CSS。watch 先完成两个构建，再启动不清空目录的双 watcher，避免一侧删除另一侧产物。

## 自动测试

1.0.1共15文件220项离线回归，新增同源父frame/跨源拒绝、前端接收及首次绘图确认、错误去重与代理/transport日志脱敏。真实浏览器还以原生父frame `postMessage`重现旧构建丢弃行情、状态为空；原先合成无source消息的替身不能发现此问题。修复验证仍是浏览器+VS Code API替身，不等于用户Windows宿主新包已安装。

1.0.0的Vitest共14文件、212项离线回归，包含状态迁移、默认指标、两图同时展示/主图保留、选择器与指南、JS信任/导入/Worker边界，以及Widget帧解码/索引修订、同根增量、断线重载、静默超时、主/辅助实际源、隐藏恢复和旧ID隔离。DOM用happy-dom、Widget替身；网络用可控socket替身，不证明真实远端。真实网络另由当前构建+VS Code API预览替身验证。

按用户明确要求，已移除 test:extension、相关依赖和 CI 宿主烟测，不再下载 VS Code。自动验证仅为离线回归、构建、打包检查；真实托管图表另用浏览器检查。

VSIX 检查直接读取 ZIP，确认版本、两个 JS 入口、Tailwind CSS、截图及 bundle 字节与当前输出一致，并排除依赖、源码、测试、context 和源映射。

third-party 打包仅允许明确白名单的依赖/指标许可证及notice（含新增WebSocket/代理依赖的合并notice）；不递归打包用户新增的指标参考目录，ZIP 校验额外拒绝 Pine 源码和非白名单 third-party 文件。

## CI

.github/workflows/ci.yml 在 push/pull_request/workflow_dispatch 执行：Node 24 → npm ci → npm test → diff 检查 → 打包 → ZIP 校验 → 上传 xihe-trading-terminal-vsix artifact（14 天）。权限仅 contents:read，不发布 Marketplace。

## 手工验证

F5 启动 Extension Development Host；创建并重命名多个工作区和图表，修改图表内部指标后切换返回，确认实例与设置保留。测试 Dark/Light、420px 窄侧栏、折叠与重开工程。使用宿主机的 Install from VSIX 安装 dist 内新包；WSL 构建与 Windows 本地安装是不同步骤。

截图须等待真实 TradingView iframe 加载完成，并使用最终构建。浏览器预览的 VS Code API 替身、真实扩展运行、远程 CI 和用户宿主机安装应分别报告。

0.0.3 浏览器验证包括真实 Binance ETH/4H Canvas、EMA20 JS Worker、6h/8h 开盘间隔、引擎切换 iframe 身份不变、死循环 Worker 两秒终止，以及屏蔽 tv.js 后窄栏错误可见和恢复。宿主机安装和远程 CI 未执行。VSIX 还须校验新截图、示例 JS 和第三方许可的实际字节。

0.0.4 在既有流程中增加全目录公式/边界/前缀稳定性与选择恢复测试；VSIX 校验新增内建选择器截图和 doc/indicators.md。CI 自动运行这些测试与 ZIP 字节检查，未新增宿主下载步骤。

1.0.0的VSIX检查还拒绝Node扩展中的browser-external替身、检查Webview已移除Binance传输，并逐字节验证全部截图及单指标showcase文档。README只用典型分类，独立展示页逐个展示30个Pine衍生预设，传统13项可组合；单图仅保留强制MA90/ZigZag和该Pine预设。

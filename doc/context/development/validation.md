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

npm ci 用于从锁文件安装；npm install 满足日常本地安装。打包工具是本地 devDependency，无需全局 vsce。package 通过 vsce 的 vscode:prepublish 运行 build，不运行测试；输出 dist/xihe-trading-terminal-0.0.4.vsix。

build 先 tsc --noEmit，再 Vite 构建扩展 CJS 与 Webview IIFE/CSS。watch 先完成两个构建，再启动不清空目录的双 watcher，避免一侧删除另一侧产物。

## 自动测试

Vitest 包含状态迁移、工作区隔离、默认指标/参数、配色、Chart/Workspace 命名、切换实例保留、关闭清理、设置保存、6h提示和注入转义等共 90 项，涵盖双引擎实例保留、行情解析/轮询取消、JS 文件导入/信任/大小限制、Worker 输出/超时/取消和托管脚本失败重试。DOM 测试使用 happy-dom，widget 为可追踪实例替身；这不能证明远程行情或参数实际生效。

按用户明确要求，已移除 test:extension、相关依赖和 CI 宿主烟测，不再下载 VS Code。自动验证仅为离线回归、构建、打包检查；真实托管图表另用浏览器检查。

VSIX 检查直接读取 ZIP，确认版本、两个 JS 入口、Tailwind CSS、截图及 bundle 字节与当前输出一致，并排除依赖、源码、测试、context 和源映射。

## CI

.github/workflows/ci.yml 在 push/pull_request/workflow_dispatch 执行：Node 24 → npm ci → npm test → diff 检查 → 打包 → ZIP 校验 → 上传 xihe-trading-terminal-vsix artifact（14 天）。权限仅 contents:read，不发布 Marketplace。

## 手工验证

F5 启动 Extension Development Host；创建并重命名多个工作区和图表，修改图表内部指标后切换返回，确认实例与设置保留。测试 Dark/Light、420px 窄侧栏、折叠与重开工程。使用宿主机的 Install from VSIX 安装 dist 内新包；WSL 构建与 Windows 本地安装是不同步骤。

截图须等待真实 TradingView iframe 加载完成，并使用最终构建。浏览器预览的 VS Code API 替身、真实扩展运行、远程 CI 和用户宿主机安装应分别报告。

0.0.3 浏览器验证包括真实 Binance ETH/4H Canvas、EMA20 JS Worker、6h/8h 开盘间隔、引擎切换 iframe 身份不变、死循环 Worker 两秒终止，以及屏蔽 tv.js 后窄栏错误可见和恢复。宿主机安装和远程 CI 未执行。VSIX 还须校验新截图、示例 JS 和第三方许可的实际字节。

0.0.4 在既有流程中增加全目录公式/边界/前缀稳定性与选择恢复测试；VSIX 校验新增内建选择器截图和 doc/indicators.md。CI 自动运行这些测试与 ZIP 字节检查，未新增宿主下载步骤。

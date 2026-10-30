# 当前进度

## 2026-10-29：0.0.2 功能与工程改造

已完成：

- 命名工作区与 Chart 重命名；旧顶层标签状态自动迁移，保留独立额外指标。
- 切换工作区、标签和重命名复用图表实例，保留会话内图表指标编辑。
- 默认 ZigZag(5%, 10) 与 MA(90)，真实托管图表已看到 Zigzag 5 10 / MA 90 close 图例。
- Gruvbox Dark/Light；Vite 8 双构建、Tailwind CSS 4、TypeScript 6 / ES2024、ESLint 10 / Vitest 5。
- 本地 vsce 打包，npm run package 只构建、不运行测试；英文 README 与最终界面深浅截图。
- GitHub Actions：锁定安装、离线检查和测试、VSIX 打包/内容校验、artifact 上传；未推送，不能声称远程 CI 已通过。
- node_modules、out 和旧 VSIX 已取消跟踪，本地文件保留。

验证：17 项回归通过；lint、类型检查、Vite 构建通过；双 watcher 启动检查通过；VSIX 实际 ZIP 版本/资源/字节和排除项校验通过；文档链接和 diff 检查通过。最终浏览器截图含真实 TradingView 图表，VS Code API 使用预览替身；420px 布局无横向溢出。

曾尝试的宿主测试失败在 VS Code 下载阶段，不是插件断言失败。用户明确要求不要下载或执行宿主冒烟，已移除相关命令、依赖及 CI 步骤，不宣称这次宿主测试通过。

已知边界：6h/8h 请求在真实 BINANCE:SOLUSDT widget 中回退为日线，保留明确提示；完整重载/重启会重建 widget，不能恢复图表内部未通过插件配置保存的编辑；社区 Pine 脚本不受支持。

功能改造已先提交 d606031；工程与插件现已按用户确定的新仓库名重命名，目录由用户自行 mv。

## 工程命名

先提交功能改造 d606031，之后按用户确定的仓库名统一为 XiheTradingTerminal（羲和），包名 xihe-trading-terminal，本地 VSIX publisher 标识 AlexiaChen。仓库地址更新为 https://github.com/AlexiaChen/XiheTradingTerminal.git；目录不自动 mv。用户取消 Marketplace 发布，因此仅保留测试与打包 artifact 的 CI，无发布 workflow、PAT 或宿主下载测试。

新工作区默认改为 ETHUSDT / 4H、Settings 折叠，显式旧值保持。未济单色侧栏图标与彩色 PNG 均由本项目 SVG 生成：上离下坎、49点与一处空位。改名后的最终截图、VSIX 和第二次提交在本次交付中同步。

## 2026-10-30：改名与最终默认值

XiheTradingTerminal / xihe-trading-terminal，origin 已指向用户给定的新仓库。默认 ETH/4H、Settings 折叠；现有显式保存值保持。未济图标源与 PNG 已完成（49 点留一位，六爻完整）。改名和默认值修改后 17 项回归、lint、类型检查与 Vite 构建通过；用户要求再次 commit，本次提交不推送。

最终深浅截图来自当前 Vite 构建，均为真实 ETH/4H 托管图表 + VS Code API 预览替身，深色 Settings 折叠，浅色 420px 宽无横向溢出。ZigZag 偏差参数修正为 `zigzag.deviation (%)`，通过临时改为 7 并观察真实图例、恢复为 5 验证生效；MA 图例为 90。VSIX 校验同时对比当前 bundle、图标及截图的实际字节。

## 2026-10-30：0.0.3 双引擎与 JS 指标

用户确认旧 SOL 配置来自工作区保存，继续保留；在核对官方授权后选择 Lightweight Charts 5.2.1，不接入需另行授权且不提供个人用途的 Advanced Charts。增加独立引擎切换 Tab、每引擎缓存、Binance 公开现货数据与原生 6h/8h、本地 JS 导入/源码保存/Worker。默认配置和 Gruvbox 保持，Widget 仍为缺省引擎。

46 项离线回归、lint、类型检查和构建通过。真实浏览器验证 ETH/4H、EMA20、6h/8h 时间间隔 21600/28800 秒、iframe 身份复用、死循环 JS 两秒终止、窄栏网络错误提示。截图来自当前构建、真实市场数据与 VS Code API 预览替身；未下载/启动 VS Code，远程 CI 尚未运行。包名版本升至0.0.3，打包仍不隐式测试，许可/示例/新截图加入 ZIP 校验。

最终 0.0.3 VSIX（19 文件）已重新生成，身份、入口、bundle、图标、三张截图、JS 示例和许可证字节校验通过；文档链接、manifest/lock、CI shell 语法和 diff 检查通过。构建产物及 node_modules 仍不跟踪。

## 2026-10-30：0.0.4 内建指标目录

按用户要求增加13项可选本地预设，默认 MA90/ZigZag 不变；按 Chart 保存/复制选项，迁移旧 Volume/RSI 且保留显式清空。指标逐一拆入 src/indicators/builtin，入口只注册，公共数学与类型分离。用户进一步明确 Fib 为单个 ZigZag 波段回撤，现采用结束点0%、起点100%的七级回撤网格，显示当前幅度及超界状态，无扩展或预测信号。

90 项离线回归、lint、类型检查与构建均通过；浏览器在真实 ETH/4H 数据上同时运行全部13项预设，无渲染错误、无横向溢出。README 包含最终构建的整体介绍图、内建功能图及浅色窄栏图，共4张截图；0.0.4 VSIX 共21文件，实际字节、身份、截图、公式文档、入口和排除项校验通过，文档链接、manifest/lock、CI shell 和 diff 检查通过。按用户授权提交，不下载/启动 VS Code，不推送或发布，未声称远程CI通过。

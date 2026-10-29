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

验证：16 项回归通过；lint、类型检查、Vite 构建通过；双 watcher 启动检查通过；VSIX 实际 ZIP 版本/资源/字节和排除项校验通过；文档链接和 diff 检查通过。最终浏览器截图含真实 TradingView 图表，VS Code API 使用预览替身；420px 布局无横向溢出。

曾尝试的宿主测试失败在 VS Code 下载阶段，不是插件断言失败。用户明确要求不要下载或执行宿主冒烟，已移除相关命令、依赖及 CI 步骤，不宣称这次宿主测试通过。

已知边界：6h/8h 请求在真实 BINANCE:SOLUSDT widget 中回退为日线，保留明确提示；完整重载/重启会重建 widget，不能恢复图表内部未通过插件配置保存的编辑；社区 Pine 脚本不受支持。

后续：按用户要求先提交本次功能，再考虑希腊女性或中国古代女性/易学相关的新项目名称，目录由用户自行 mv。

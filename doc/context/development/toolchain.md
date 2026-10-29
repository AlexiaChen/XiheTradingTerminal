# 工具链与兼容性

2026-10-29 查询 npm 和官方兼容范围后选用：

| 工具 | 版本/目标 | 原因 |
| --- | --- | --- |
| 开发 Node | 24 | .nvmrc 和 CI 一致，满足当前构建工具要求 |
| 扩展运行目标 | Node 22 / ES2024 | 对齐最低 VS Code 的运行环境，不盲目生成最新语法 |
| TypeScript | 6.0.3 | 当前 typescript-eslint 明确要求 >=4.8.4 <6.1；不强行升到 npm latest 7 |
| Vite | 8.3.5 | 扩展 CJS、前端 IIFE 和静态 CSS 构建 |
| Tailwind / 插件 | 4.3.3 | 统一控件和布局样式 |
| Vitest | 5.0.5 | DOM 交互及状态回归 |
| ESLint | 10.13.0 | 配合 typescript-eslint 8.72.1 |
| VS Code API 类型 | 1.108.1 | 与最低 API 版本一致，避免误用新 API |
| @types/node | 22.20.5 | 描述目标扩展宿主 API，而不是开发 Node 的最新 API |
| vsce | 4.1.0 | 项目内开发依赖，独立打 VSIX |

ES2022 不是过时或不能用；这里升级到明确的 ES2024 基线。tsc 仅做类型检查，Vite 负责生成产物。源码模块使用 ESNext/Bundler 解析，扩展输出 CommonJS 以匹配现有 manifest 入口。

Vite 不替代 npm；npm 负责依赖与命令，Vite 负责构建。VS Code 官方打包文档主要示例是 esbuild/webpack；Vite 可以构建扩展和 Webview，不宜宣称是所有插件的唯一主流标准。官方历史 Webview 样例也有 React+Vite（该样例仓库已归档）。

参考：[VS Code bundling](https://code.visualstudio.com/api/working-with-extensions/bundling-extension)、[Vite library mode](https://vite.dev/guide/build.html#library-mode)、[typescript-eslint 版本范围](https://typescript-eslint.io/users/dependency-versions/)。确切依赖以 package-lock.json 为准。

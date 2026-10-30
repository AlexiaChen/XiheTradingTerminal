# Gruvbox 与 Tailwind

参考相邻 kline-trainer/src/ui/render.rs 的默认配色：背景 #1d2021、面板 #282828、文字 #ebdbb2、边框 #504945、雾蓝 #83a598、麦黄 #d79921；默认蓝涨金跌。

图表颜色在 src/theme.ts/GRUVBOX_PALETTE 和 widgetOptions；控件主题变量及 Tailwind 组件样式在 src/webview/styles.css。Tailwind CSS 4 通过 @tailwindcss/vite 编译为 out/webview.css，不加载运行时 CDN，不新增前端框架。

Dark 图表背景 #282828、网格 #504945；Light 背景 #fbf1c7、网格 #d5c4a1。实体、边框、影线和额外成交量 study 都使用同一蓝/金涨跌色。主题存储值继续使用 dark/light。

2026-10-29 检查官方 tv.js 对 overrides/studies_overrides 的转发，并在浏览器加载真实图表确认蓝/金 K 线生效。TradingView 自己的菜单、工具条和个别指标颜色可保留标准样式。

最终截图放在 doc/assets，README 引用；截图是实际构建后的 Webview + 真实托管图表，VS Code API 使用预览替身，不能当作用户宿主机安装证据。

## 未济图标

侧边栏 media/icon.svg 使用单色六爻，上离下坎，从上到下阳阴阳阴阳阴。大图标 media/xihe.svg 及其 256px PNG 采用上卦麦黄、下卦雾蓝；外围五十等分点位绘四十九点，顶部留空一位。它是用户“大衍五十、其用四十九、遁去其一”意象的视觉表达，不改动未济六爻，也不作为交易预测或卜筮功能。

参考原典：[未济象传](https://ctext.org/book-of-changes/wei-ji2)。SVG 是可编辑源，PNG 通过浏览器渲染得到；VS Code 侧边栏图标独立保持 currentColor。

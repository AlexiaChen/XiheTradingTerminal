# 当前进度

## 2026-10-30：1.0.0 主图与指标预览同时展示

用户明确要求从调研推进到完整插件、持续同步、删除Binance API、升级1.0.0，并要求README少量典型图、独立Built-in Indicator Showcase。托管主图和Lightweight预览现宽屏并排、窄栏上下；主图内部标的/实际周期通过消息跟随，保留缓存实例与旧工作区。原engine字段保留兼容但不切换显示。

扩展宿主原生匿名订阅Widget同一行情服务，无额外浏览器/密钥/cookie；主流1000根、辅助每流最多12000根，明确实际源、时区/时段和延迟。心跳/拆帧/索引修订、增量合并、断线退避重载、隐藏取消和恢复、旧ID隔离均已实现。代码/前端CSP中的Binance REST路径移除，代理跟随宿主环境。数据来源是独立连接，未宣称iframe数据API或十字线/平移/画线联动。

ETH连续更新、Widget内部改1H/改MSFT后保持iframe并自动跟随、美股BATS_DLY源与15分钟延迟、同源辅助5m及主动断线重载已真实验证。子周期按实际父K线起点对齐；缺失量/子周期不制造；固定UTC高周期预设在非24x7时省略并说明。

真实验证还覆盖AAPL往返缓存后修改MSFT/1H时保留iframe；主图报价按ticker/venue隔离，恢复时重新接管tv.js共享回调，隐藏实例迟到ready不抢占。

截图遵循用户最终要求：30个Pine衍生预设各自一张，只保留强制MA90/ZigZag；传统指标可组合。产品仍支持43项多选叠加。英文README展示典型分类并链接[独立展示页](../../built-in-indicator-showcase.md)。重建主图时清除旧的内部标的/周期观察，加载中明确回到Settings直到新实例确认。离线验证已通过lint、类型检查、双Vite构建和14文件212项回归；所有截图/实时验证均为当前构建+VS Code API替身，未下载/启动真实VS Code宿主，不推送/发布。

交付验证：最终 `npm test` 通过lint、类型检查、双Vite构建和14文件212项回归；130条本地文档链接和diff检查通过。35张分类展示图覆盖30个Pine单项及13个传统预设，6张README/界面图来自同一最终构建；全部PNG字节和指南/许可已在VSIX核对。1.0.0包共62文件，约7.96MB，不含源码、Pine参考、依赖目录、测试或context；无Node browser-external替身，无旧Binance传输。截图与真实网络实验均为VS Code API预览替身，未执行真实宿主/远程CI，不提交/推送/发布。

## 2026-10-30：托管 Widget 行情桥接调研（未接入产品）

按用户要求使用agent-browser研究从托管View取得数据。当前`67423e0`重新构建的Webview + VS Code API替身中，父页面跨域读取失败；`tv.js`没有Advanced Charts的`activeChart/exportData`。包装层symbolInfo/quoteUpdate确能返回元信息和最新报价，但没有历史OHLCV。

通过浏览器CDP只读观察正常Widget连接，实得ETH/4H与AAPL/日线各300根OHLCV，观察到ETH最后一根增量。请求`NASDAQ:AAPL`实际解析为`BATS_DLY:AAPL`（Cboe One），不能宣称NASDAQ完整实时源。AAPL快照送入临时Lightweight页，复用项目MA90/ZigZag、RSI/Evasive SuperTrend适配层和JS Worker EMA20，渲染成功，无warnings/页面错误。

此为浏览器捕获与快照回放PoC，没有正式连续桥接、多周期/重连覆盖或真实扩展宿主验证。正式功能仍仅从Binance取本地行情；脚本、数据及截图只在`/tmp`。只更新调研文档，不改产品代码、README功能声明或CHANGELOG。证据、官方接口区别、潜在架构及数据授权边界见[调研记录](../research/widget-data-bridge.md)。

## 2026-10-30：分类 Pine 衍生预设、绘图适配及叠加指南

用户授权尽可能移植全部30份参考，随后要求 Pine/TS 对齐分类、分类下拉、多选叠加、关键点与悬浮指南，测试、README/Context/截图同步并本地 commit。30份参考已按7类移动，字节与整理前 `26678e9` 完全一致；每份有独立 TS 入口，加上原13项共43项可选预设，UI八类别（包含原震荡指标分类）。稳定ID、默认ETH/4H、折叠Settings、MA90/ZigZag和已有状态保持。

这是源算法衍生的固定预设与选定默认图层，**没有复制全部参数/警报/统计格子或证明TradingView逐点一致**。完整缩减与时序差异见 [英文30项指南](../../pine-indicators.md) 和 [中文架构/功能记录](../features/pine-indicators.md)。尤其SR MTF采用对称区域状态机而不复现原数组边缘行为；HTF reversal统一源周期收盘可用性；Profile Nodes校正峰值矩形对齐；模拟使用报价单位并等待ATR预热。tick、外部TV source和原版可选设置不能冒充支持。

计算返回声明式绘图，通过独立 BuiltinRenderer/IndicatorPrimitive 及公开插件接口处理，不 fork Lightweight Charts 5.2.1，不给指标逻辑暴露原始图表/DOM。辅助数据按选择分页缓存、每流最多12000根；缺失组不代填，绘图每项1500对象上限明确提示。已选chips跨类别保留，hover/focus/click指南说明用途、颜色、作者及局限；搜索/分类/指南不重建图表。真实量/统计评分/回溯锚点区别写入指南。28份LuxAlgo衍生保留CC BY-NC-SA 4.0，另外两份许可本地未声明，不标成MIT原创；NOTICE和英文指南打入VSIX，Pine源码仍排除。

验证：最终 `npm test` 通过 lint、类型检查、双Vite构建和200项回归（11测试文件）。覆盖30项有限绘图/空数据、枢轴时序、量分布守恒、强度公式、MTF分组/缺口、源请求分页/增量/取消、primitive坐标/复用/detach、分类跨类叠加及指南交互。79条本地文档链接与diff检查通过；CI新增文档链接步骤，既有测试/VSIX校验覆盖新资源；workflow YAML及6段shell语法检查通过。

浏览器使用当前bundle和VS Code API替身，真实Binance ETH/4H及5m同时选择全部43项并成功渲染，无横向溢出；4H下Volume Delta如实显示50/1000条覆盖，Nodes有完整360条15m窗口；5m下Delta显示1000/1000，Nodes使用1m，HTF15m形态、1H投影及UTC−5 killzones走有效路径。桌面1440×960与420px浅色窄栏、分类和悬浮指南完成可视检查，5张README截图已全部更新为当前构建。原Widget实际远程K线、MA90、ZigZag也可见；about:blank预览的Widget出现第三方localStorage/origin警告，不能把它当作真实宿主结论。

本地0.0.4 VSIX共24文件，实际身份、bundle、5张截图、两份指南、全部依赖/指标许可说明的字节校验通过；不含Pine、源码、依赖目录或测试。本轮由用户授权commit，不推送、不发布；未下载/启动VS Code，没有远程CI运行结果或用户宿主安装验证。

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

## 2026-10-30：0.0.4 搜索下拉改进

按用户补充要求，将内建指标展开区改为可搜索多选下拉。搜索名称/参数/中文别名，多词过滤不清除已选项，不写入状态或重建图表。新增独立 indicatorPicker.ts；方向键、Enter、Space、Escape、外部点击与切换范围关闭均有明确行为。

92项回归、lint、类型检查与构建通过。浏览器真实行情已验证中文搜索、键盘勾选/取消、Escape还原焦点、外部点击关闭，以及展开时图表位置不变；420px下拉边界与页面宽度检查通过。README及截图同步，仍为0.0.4；最终打包验证与提交按既有流程执行，不推送，不执行宿主下载测试。

工作中出现用户新增的 third-party/tradingview-indicator Pine 参考资料，保留原样且不随本次 UI 提交。将 VSIX third-party 规则收紧为实际依赖许可白名单，校验拒绝非许可文件和 Pine 源码，避免参考资料被旧递归规则意外打入安装包。

搜索下拉版0.0.4安装包已重建（21文件），包内bundle、4张截图、公式说明及依赖许可字节校验通过；用户参考目录未被打包，文档链接、CI脚本和diff检查通过。

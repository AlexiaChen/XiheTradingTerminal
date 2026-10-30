# 本地内建指标（0.0.4）

当前目录扩展为43个可选预设：本页记录最初13项独立公式，新增30项参考移植见 [Pine 分类及指南](pine-indicators.md)。算法已按类别迁入 `builtin/<category>/`，原有 ID/默认选择/公式约定保持；不能把本页“独立实现”泛化到带源许可的新增预设。

用户要求多加入内建 JS 指标、参考 TradingView 官网与社区作品；每个指标必须有独立具名 TS 文件，不能堆在大文件中。随后明确：斐波那契用于衡量一个 ZigZag 波段的回撤幅度，不是方向预测。

## 目录与注册

```text
src/indicators/
├── builtin/
│   ├── autoFibRetracement.ts
│   ├── emaRibbon.ts
│   ├── bollingerBands.ts
│   ├── donchianChannels.ts
│   ├── keltnerChannels.ts
│   ├── supertrend.ts
│   ├── sessionVwap.ts
│   ├── volume.ts
│   ├── rsi.ts
│   ├── macd.ts
│   ├── stochastic.ts
│   ├── atr.ts
│   ├── squeezeMomentum.ts
│   ├── simpleMovingAverage.ts
│   ├── zigzag.ts
│   └── index.ts           # 仅注册/分发
├── catalog.ts            # ID、名称、固定参数、主图/副图位置
├── math.ts               # 窗口、平滑、TR 等公共数值运算
├── palette.ts
├── types.ts
├── validatePlots.ts      # 原有自定义 JS 输出校验
└── index.ts              # 兼容原有导入入口
```

原 src/indicators.ts 已拆分，MA90、ZigZag 和 RSI 计算口径保留。13 个可选项包括 Volume/RSI；除迁移旧设置外，新图表默认可选项为空，默认 MA90/ZigZag 始终保留。

## 斐波那契回撤

自动使用最近两个已确认的 ZigZag(5%,10) 枢轴作为单段锚点。锚点计算排除尚未完成的最后一根 K 线。设起点价 A、结束价 B，比例 r 的价格为 B−(B−A)×r：结束点0%、起点100%。显示0/23.6/38.2/50/61.8/78.6/100%，不含扩展位。

当前回撤率=(B−当前收盘价)/(B−A)×100%。高低锚点的排列只影响坐标换算，不能称为方向预测。超出0–100%时保留原数值并明确标注；不夹紧、不生成买卖信号。网格覆盖最新所选波段至当前，锚点更新后会整体变化，是回顾性测量，不是历史交易信号序列。少于两个已确认枢轴时提示等待，不绘制旧网格。

## 公式与研究记录

按 TradingView 官方帮助页中的公共公式独立实现常用指标；社区重点参考 LazyBear 公布的 Squeeze Momentum 思路：BB/KC 压缩状态与去趋势价格的线性回归末值。源码不嵌入社区 Pine，不做逐点一致或不重绘承诺。

固定参数、初始化、窗口限制和逐项官方链接见英文[指标说明](../../indicators.md)。Squeeze 的 KC 使用 SMA20(TR)×1.5，独立 Keltner 预设使用 EMA20/ATR10×2，二者不可混称。EMA 从首个值启动、按周期隐藏预热，MACD 信号从第34根显示；ATR 用Wilder，随机指标平区为50。VWAP 仅盘中、UTC日重置，首个不完整UTC日不算完整日均价。

## 前端与状态

- 在 Lightweight Charts 下使用 Built-in Indicators 可搜索多选下拉框；浮层覆盖图表，不挤占图表高度。目录初始化一次，勾选后保留焦点和搜索条件。
- 搜索名称、ID、参数及中文别名，大小写无关、按空白分词；过滤不清空隐藏项的选择。提供无结果提示、结果数和已选数。方向键导航，搜索框 Enter 切换首项，Escape 关闭并还原焦点；点击外部或切换 Chart/Workspace/引擎关闭。重新打开清空搜索。
- `ChartTab.localIndicators` 保存有序去重的合法 ID；旧状态无该字段时，把原 Volume/RSI study 映射进来。显式 [] 永远保持关闭，不被旧 study 再次勾回。
- 本地选择不改变 `studies`，也不使缓存 Widget 失效。附加 study ID 输入框在本地图表中只展示 Widget 保存值，不混作本地选择器。
- 主图叠加项、副图指标各分组；同一指标多条线共用副图，刷新复用 series。Supertrend 非活动段使用 whitespace，Squeeze 用彩色柱及0轴点。
- JS 文件接口、Worker 信任与超时约束保持。内建公式为本项目打包代码，无需用户导入文件。

## 验证边界

离线覆盖手算 BB/ATR/Keltner、EMA/MACD 解析期望、Supertrend 换向、VWAP 跨日/零成交量/截断日、Stochastic 平区、Squeeze 压缩/回归、Fib 两种锚点排列/当前未完成K线/超界读数、全目录空数据及1000根数据有限性和非Fib前缀稳定性。DOM 覆盖独立选择、恢复、复制及 Widget 缓存不受影响。浏览器真实 Binance 行情检查独立于离线断言和实际 VS Code 宿主。

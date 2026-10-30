import { BUILTIN_INDICATORS, INDICATOR_CATEGORIES, normalizeLocalIndicators, type BuiltinIndicatorId } from "../indicators/catalog";

const aliases: Partial<Record<BuiltinIndicatorId, string>> = {
  "auto-fib": "斐波那契 回撤 fibonacci retracement", "ema-ribbon": "均线 指数 均线带",
  bollinger: "布林 布林带 bb", donchian: "唐奇安 通道 dc", keltner: "肯特纳 通道 kc",
  supertrend: "超级趋势 趋势", vwap: "成交量加权 日均价", volume: "成交量 量能",
  rsi: "相对强弱", macd: "指数平滑异同移动平均", stochastic: "随机指标 stoch",
  atr: "平均真实波幅 波动率", squeeze: "挤压 压缩 动量",
  "evasive-supertrend": "规避 超级趋势 噪声", "trendline-navigator": "趋势线 突破 导航",
  "trendline-hold-rate": "趋势线 触碰 突破 回测 保持率", "sr-breaks": "支撑 阻力 突破",
  "sr-mtf": "支撑 阻力 多周期", "sr-pro": "支撑 阻力 区域",
  "pivot-missed": "枢轴 遗漏 反转 幽灵", "nomada-levels": "买方 卖方 四小时 价位",
  "breakout-retest": "突破 测试 重测", "liquidity-sweeps": "流动性 扫单 扫荡",
  "pa-liquidity-sweeps": "纯价格 流动性 扫单", "pa-structures": "纯价格 市场 结构",
  "swing-sequence": "波段 突破 序列", "msb-ob-score": "市场结构 突破 订单块 评分",
  imfvg: "公允价值 缺口 即时 回补", "ict-unicorn": "独角兽 模型", "pa-ict": "纯价格 ICT 工具",
  smc: "聪明钱 市场结构 订单块", "clusters-vp": "聚类 成交量 分布",
  "delta-flow": "差量 资金流 分布", "institutional-flow": "机构 订单流 强度",
  "liquidity-delta": "流动性 差量 四象限", "liquidity-depth": "流动性 结构 深度 热力图",
  "volume-delta": "成交量 差量 蜡烛", "volume-nodes": "成交量 分布 节点",
  "volumetric-structure": "成交量 订单流 结构", "htf-reversal": "高周期 反转 背离",
  "htf-po3": "高周期 投影 三阶段", "ict-killzones": "猎杀 时段 交易时段",
  "signal-backtester": "信号 评估 回测"
};

/** Search and selection are independent: filtering never alters a chart or its saved choices. */
export class IndicatorPicker {
  private readonly toggle: HTMLButtonElement;
  private readonly dropdown: HTMLElement;
  private readonly search: HTMLInputElement;
  private readonly options: HTMLElement;
  private readonly category: HTMLSelectElement;
  private readonly rows: { label: HTMLLabelElement; input: HTMLInputElement; text: string; id: BuiltinIndicatorId; category: string }[] = [];
  private selected: BuiltinIndicatorId[] = [];
  private scope = "";

  constructor(private readonly root: HTMLElement, private readonly onChange: (ids: BuiltinIndicatorId[]) => void) {
    this.toggle = this.node("builtinToggle");
    this.dropdown = this.node("builtinDropdown");
    this.search = this.node("builtinSearch");
    this.options = this.node("builtinOptions");
    this.category = root.ownerDocument.createElement("select"); this.category.className = "tv-select builtin-category";
    this.category.setAttribute("aria-label", "Indicator category");
    for (const group of [{ id: "", name: "All categories" }, ...INDICATOR_CATEGORIES]) {
      const option = root.ownerDocument.createElement("option"); option.value = group.id; option.textContent = group.name; this.category.append(option);
    }
    this.dropdown.insertBefore(this.category, this.options);
    this.category.addEventListener("change", () => this.update());
    for (const item of BUILTIN_INDICATORS) {
      const label = root.ownerDocument.createElement("label");
      label.className = "builtin-option";
      const input = root.ownerDocument.createElement("input");
      input.type = "checkbox"; input.id = `builtin-${item.id}`;
      const text = root.ownerDocument.createElement("span");
      const name = root.ownerDocument.createElement("strong"); name.textContent = item.name;
      const description = root.ownerDocument.createElement("small"); description.textContent = `${item.pane ? "Separate pane" : "Overlay"} · ${item.parameters}`;
      text.append(name, description); label.append(input, text); this.options.append(label);
      const group = INDICATOR_CATEGORIES.find(group => group.id === item.category)!;
      this.rows.push({ label, input, id: item.id, category: item.category, text: `${item.name} ${item.id} ${item.parameters} ${aliases[item.id] ?? ""} ${group.name}`.toLocaleLowerCase() });
      input.addEventListener("change", () => {
        this.selected = normalizeLocalIndicators(input.checked ? [...this.selected, item.id] : this.selected.filter(id => id !== item.id));
        this.onChange([...this.selected]);
        this.update();
      });
    }
    this.toggle.addEventListener("click", () => this.dropdown.hidden ? this.open() : this.close(true));
    this.node("builtinClose").addEventListener("click", () => this.close(true));
    this.search.addEventListener("input", () => this.update());
    root.ownerDocument.addEventListener("pointerdown", event => {
      if (!root.contains(event.target as Node)) { this.close(false); }
    });
    root.addEventListener("focusout", event => {
      if (event.relatedTarget instanceof Node && !root.contains(event.relatedTarget)) { this.close(false); }
    });
    root.addEventListener("keydown", event => {
      if (event.target === this.toggle && this.dropdown.hidden && ["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault(); this.open(); return;
      }
      if (this.dropdown.hidden) { return; }
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation(); this.close(true); return;
      }
      if (event.target === this.category) { return; }
      const inputs = this.rows.filter(row => !row.label.hidden).map(row => row.input);
      if (event.target === this.search && event.key === "Enter") {
        event.preventDefault(); inputs[0]?.click(); return;
      }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        if (!inputs.length) { return; }
        const index = inputs.indexOf(root.ownerDocument.activeElement as HTMLInputElement);
        const next = index < 0 ? event.key === "ArrowDown" ? 0 : inputs.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + inputs.length) % inputs.length;
        inputs[next].focus();
      }
    });
    this.update();
  }

  sync(selected: BuiltinIndicatorId[], scope: string) {
    if (this.scope && this.scope !== scope) { this.close(false); }
    this.scope = scope;
    this.selected = [...selected];
    this.update();
  }

  private node<T extends HTMLElement>(id: string): T {
    const node = this.root.querySelector(`#${id}`);
    if (!node) { throw new Error(`Missing indicator picker element: ${id}`); }
    return node as T;
  }

  private open() {
    this.search.value = "";
    this.dropdown.hidden = false;
    this.toggle.setAttribute("aria-expanded", "true");
    this.update(); this.search.focus();
  }

  private close(restoreFocus: boolean) {
    if (this.dropdown.hidden) { return; }
    this.dropdown.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    if (restoreFocus) { this.toggle.focus(); }
  }

  private update() {
    const tokens = this.search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of this.rows) {
      row.input.checked = this.selected.includes(row.id);
      row.label.hidden = !!this.category.value && row.category !== this.category.value || !tokens.every(token => row.text.includes(token));
      if (!row.label.hidden) { visible++; }
    }
    this.node("builtinCount").textContent = this.selected.length ? `(${this.selected.length})` : "";
    this.node("builtinEmpty").hidden = visible > 0;
    this.node("builtinResults").textContent = `${visible} of ${this.rows.length} indicators · ${this.selected.length} selected · saved per chart`;
  }
}

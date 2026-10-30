import { BUILTIN_INDICATORS, normalizeLocalIndicators, type BuiltinIndicatorId } from "../indicators/catalog";

const aliases: Record<BuiltinIndicatorId, string> = {
  "auto-fib": "斐波那契 回撤 fibonacci retracement", "ema-ribbon": "均线 指数 均线带",
  bollinger: "布林 布林带 bb", donchian: "唐奇安 通道 dc", keltner: "肯特纳 通道 kc",
  supertrend: "超级趋势 趋势", vwap: "成交量加权 日均价", volume: "成交量 量能",
  rsi: "相对强弱", macd: "指数平滑异同移动平均", stochastic: "随机指标 stoch",
  atr: "平均真实波幅 波动率", squeeze: "挤压 压缩 动量"
};

/** Search and selection are independent: filtering never alters a chart or its saved choices. */
export class IndicatorPicker {
  private readonly toggle: HTMLButtonElement;
  private readonly dropdown: HTMLElement;
  private readonly search: HTMLInputElement;
  private readonly options: HTMLElement;
  private readonly rows: { label: HTMLLabelElement; input: HTMLInputElement; text: string; id: BuiltinIndicatorId }[] = [];
  private selected: BuiltinIndicatorId[] = [];
  private scope = "";

  constructor(private readonly root: HTMLElement, private readonly onChange: (ids: BuiltinIndicatorId[]) => void) {
    this.toggle = this.node("builtinToggle");
    this.dropdown = this.node("builtinDropdown");
    this.search = this.node("builtinSearch");
    this.options = this.node("builtinOptions");
    for (const item of BUILTIN_INDICATORS) {
      const label = root.ownerDocument.createElement("label");
      label.className = "builtin-option";
      const input = root.ownerDocument.createElement("input");
      input.type = "checkbox"; input.id = `builtin-${item.id}`;
      const text = root.ownerDocument.createElement("span");
      const name = root.ownerDocument.createElement("strong"); name.textContent = item.name;
      const description = root.ownerDocument.createElement("small"); description.textContent = `${item.pane ? "Separate pane" : "Overlay"} · ${item.parameters}`;
      text.append(name, description); label.append(input, text); this.options.append(label);
      this.rows.push({ label, input, id: item.id, text: `${item.name} ${item.id} ${item.parameters} ${aliases[item.id]}`.toLocaleLowerCase() });
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
      row.label.hidden = !tokens.every(token => row.text.includes(token));
      if (!row.label.hidden) { visible++; }
    }
    this.node("builtinCount").textContent = this.selected.length ? `(${this.selected.length})` : "";
    this.node("builtinEmpty").hidden = visible > 0;
    this.node("builtinResults").textContent = `${visible} of ${this.rows.length} indicators · ${this.selected.length} selected · saved per chart`;
  }
}

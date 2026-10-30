import { BUILTIN_INDICATORS, type BuiltinIndicatorId } from "../indicators/catalog";
import { indicatorGuide } from "../indicators/guides";

/** One accessible guide card for the selected overlay chips, independent of chart lifecycle. */
export class IndicatorGuides {
  private readonly chips: HTMLElement;
  private readonly card: HTMLElement;
  private current?: BuiltinIndicatorId;
  private timer?: ReturnType<typeof setTimeout>;
  private scope = "";
  constructor(private readonly root: HTMLElement, private readonly remove: (id: BuiltinIndicatorId) => void) {
    this.chips = document.createElement("div"); this.chips.className = "builtin-chips";
    this.card = document.createElement("section"); this.card.className = "indicator-guide"; this.card.id = "indicatorGuideCard"; this.card.hidden = true;
    this.card.setAttribute("role", "tooltip");
    this.card.setAttribute("aria-label", "Selected indicator guide");
    this.card.addEventListener("pointerenter", () => clearTimeout(this.timer));
    this.root.addEventListener("pointerleave", () => this.scheduleClose());
    this.root.addEventListener("focusout", event => { if (!root.contains(event.relatedTarget as Node)) { this.close(); } });
    document.addEventListener("pointerdown", event => { if (!root.contains(event.target as Node)) { this.close(); } });
    root.addEventListener("keydown", event => { if (event.key === "Escape" && !this.card.hidden) { event.preventDefault(); this.close(); } });
    root.append(this.chips, this.card);
  }
  sync(ids: BuiltinIndicatorId[], scope = "") {
    if (this.scope !== scope) { this.close(); } this.scope = scope;
    if (this.current && !ids.includes(this.current)) { this.close(); }
    this.chips.replaceChildren();
    if (!ids.length) { return; }
    const caption = document.createElement("span"); caption.className = "selected-caption"; caption.textContent = `Applied (${ids.length})`; this.chips.append(caption);
    for (const item of BUILTIN_INDICATORS.filter(item => ids.includes(item.id))) {
      const chip = document.createElement("span"); chip.className = "selected-indicator";
      const help = document.createElement("button"); help.type = "button"; help.className = "indicator-guide-toggle";
      help.textContent = `${item.name} ⓘ`; help.setAttribute("aria-label", `Guide: ${item.name}`); help.setAttribute("aria-controls", this.card.id);
      help.setAttribute("aria-describedby", this.card.id);
      help.addEventListener("pointerenter", () => this.show(item.id)); help.addEventListener("focus", () => this.show(item.id));
      help.addEventListener("click", () => this.show(item.id));
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "indicator-remove"; remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${item.name}`); remove.addEventListener("click", () => this.remove(item.id));
      chip.append(help, remove); this.chips.append(chip);
    }
  }
  private show(id: BuiltinIndicatorId) {
    clearTimeout(this.timer); this.current = id;
    const item = BUILTIN_INDICATORS.find(item => item.id === id)!, guide = indicatorGuide(id);
    this.card.replaceChildren();
    const title = document.createElement("strong"); title.textContent = item.name; this.card.append(title);
    for (const [label, text] of [["", guide.summary], ["How to read", guide.usage], ["Marks & colors", guide.signals], ["Limits", guide.limitations], ["Source", guide.author]]) {
      const paragraph = document.createElement("p");
      if (label) { const heading = document.createElement("b"); heading.textContent = `${label}: `; paragraph.append(heading); }
      paragraph.append(document.createTextNode(text)); this.card.append(paragraph);
    }
    this.card.hidden = false;
  }
  private scheduleClose() { clearTimeout(this.timer); this.timer = setTimeout(() => this.close(), 250); }
  close() { clearTimeout(this.timer); this.current = undefined; this.card.hidden = true; }
}

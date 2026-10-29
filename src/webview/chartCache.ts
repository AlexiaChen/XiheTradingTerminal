import type { ChartTab } from "../chartState";

type Widget = { remove?: () => void };
type Entry = { key: string; widget: Widget; element: HTMLElement };

/** Keep the hosted iframe alive across tab/workspace switches: its internal indicator edits live there. */
export class ChartCache {
  private entries = new Map<string, Entry>();
  private sequence = 0;

  constructor(private readonly container: HTMLElement, private readonly create: (tab: ChartTab, id: string) => Widget) {}

  show(workspaceId: string, tab: ChartTab) {
    const id = JSON.stringify([workspaceId, tab.id]);
    const key = JSON.stringify([tab.symbol, tab.interval, tab.studies, tab.theme, tab.timezone]);
    let entry = this.entries.get(id);
    if (entry && entry.key !== key) { this.remove(id); entry = undefined; }
    for (const value of this.entries.values()) { value.element.hidden = true; }
    if (entry) { entry.element.hidden = false; return; }
    const element = this.container.ownerDocument.createElement("div");
    element.id = `chart-${++this.sequence}`;
    element.className = "chart-instance";
    this.container.appendChild(element);
    try {
      this.entries.set(id, { key, element, widget: this.create(tab, element.id) });
    } catch (error) {
      element.remove();
      throw error;
    }
  }

  retain(ids: Set<string>) {
    for (const id of this.entries.keys()) { if (!ids.has(id)) { this.remove(id); } }
  }

  private remove(id: string) {
    const entry = this.entries.get(id);
    entry?.widget.remove?.();
    entry?.element.remove();
    this.entries.delete(id);
  }
}

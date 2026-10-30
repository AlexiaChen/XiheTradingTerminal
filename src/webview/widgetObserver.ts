import { canonicalInterval } from "../marketData/widgetProtocol";

export type HostedWidget = {
  remove?: () => void;
  ready?: (callback: () => void) => void;
  getSymbolInfo?: (callback: (info: { name?: string; interval?: string; exchange?: string }) => void) => void;
  subscribeToQuote?: (callback: (quote: { original_name?: string; short_name?: string; exchange?: string }) => void) => void;
};

/** Follow only messages exposed by tv.js; no cross-origin DOM or chart injection. */
export function observeWidget(widget: HostedWidget, changed: (symbol: string, interval: string) => void) {
  if (!widget.getSymbolInfo || !widget.subscribeToQuote) { return { setVisible: (_value: boolean) => {}, remove: () => widget.remove?.() }; }
  let visible = true, disposed = false, ready = false, timer: ReturnType<typeof setInterval> | undefined;
  const quotes = new Map<string, string>();
  const key = (name: string | undefined, exchange: string | undefined) => JSON.stringify([name, exchange ?? ""]);
  let latest = "";
  const poll = () => {
    if (disposed || !visible || document.hidden) { return; }
    widget.getSymbolInfo?.(info => {
      const interval = canonicalInterval(info?.interval) ?? String(info?.interval ?? ""), symbol = quotes.get(key(info?.name, info?.exchange));
      if (disposed || !visible || !interval || !symbol) { return; }
      const identity = JSON.stringify([symbol, interval]);
      if (identity !== latest) { latest = identity; changed(symbol, interval); }
    });
  };
  const begin = () => {
    if (disposed || timer) { return; }
    ready = true;
    if (visible) { subscribe(); }
    poll(); timer = setInterval(poll, 2000);
  };
  // tv.js shares quoteUpdate handlers across instances. Reclaim the handler when
  // a cached main becomes active; a late hidden iframe must not steal it.
  const subscribe = () => widget.subscribeToQuote?.(value => {
    if (value?.original_name && value.short_name) { quotes.set(key(value.short_name, value.exchange), value.original_name); }
    if (quotes.size > 64) { quotes.delete(quotes.keys().next().value!); }
    poll();
  });
  if (widget.ready) { widget.ready(begin); } else { begin(); }
  return {
    setVisible(value: boolean) {
      const restored = value && !visible;
      visible = value;
      if (visible) { if (restored && ready) { subscribe(); } poll(); }
    },
    remove() { disposed = true; clearInterval(timer); widget.remove?.(); }
  };
}

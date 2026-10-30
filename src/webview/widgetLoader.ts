export const WIDGET_SCRIPT_URL = "https://s3.tradingview.com/tv.js";
export const WIDGET_LOAD_TIMEOUT_MS = 15_000;

/** Load the hosted library without blocking the terminal controls; failed attempts can be retried. */
export function createWidgetLoader(document: Document, isReady: () => boolean, nonce: string) {
  let pending: Promise<void> | undefined;
  return function load(): Promise<void> {
    if (isReady()) { return Promise.resolve(); }
    if (pending) { return pending; }
    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.nonce = nonce;
    script.async = true;
    pending = new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) { return; }
        settled = true;
        clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        if (error) { script.remove(); reject(error); }
        else { resolve(); }
      };
      const timer = setTimeout(() => finish(new Error("TradingView took too long to load. Check your network or proxy, then retry.")), WIDGET_LOAD_TIMEOUT_MS);
      script.onerror = () => finish(new Error("Could not load TradingView from s3.tradingview.com. Check your network or proxy, then retry."));
      script.onload = () => finish(isReady() ? undefined : new Error("TradingView loaded without its chart API. Retry the chart."));
      document.head.appendChild(script);
    }).catch(error => { pending = undefined; throw error; });
    return pending;
  };
}

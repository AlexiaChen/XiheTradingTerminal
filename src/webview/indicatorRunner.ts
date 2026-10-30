import type { Candle } from "../marketData";
import { validatePlots, type IndicatorPlot } from "../indicators";

export function runIndicator(source: string, bars: Candle[], signal: AbortSignal): Promise<IndicatorPlot[]> {
  if (signal.aborted) { return Promise.reject(new Error("Indicator cancelled.")); }
  // Classic worker source, parsed as JavaScript without eval/Function or access to the Webview DOM/API.
  const wrapper = `\n;self.onmessage = async event => {
    try {
      if (typeof calculate !== 'function') throw new Error('Define function calculate(bars) in your JS file.');
      self.postMessage({ plots: await calculate(event.data) });
    } catch (error) { self.postMessage({ error: String(error && error.message || error) }); }
  };`;
  const url = URL.createObjectURL(new Blob([source, wrapper], { type: "text/javascript" }));
  return new Promise((resolve, reject) => {
    let worker: Worker;
    let timer: ReturnType<typeof setTimeout>;
    let settled = false;
    const finish = (error?: Error, plots?: IndicatorPlot[]) => {
      if (settled) { return; }
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      worker?.terminate();
      URL.revokeObjectURL(url);
      if (error) { reject(error); } else { resolve(plots ?? []); }
    };
    const abort = () => finish(new Error("Indicator cancelled."));
    try {
      worker = new Worker(url);
      timer = setTimeout(() => finish(new Error("Indicator exceeded the 2 second time limit.")), 2000);
      signal.addEventListener("abort", abort, { once: true });
      worker.onerror = event => { event.preventDefault(); finish(new Error(event.message || "Indicator failed to run.")); };
      worker.onmessage = event => {
        try {
          if (event.data?.error) { throw new Error(String(event.data.error)); }
          finish(undefined, validatePlots(event.data?.plots, bars));
        } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
      };
      worker.postMessage(bars);
    } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
  });
}

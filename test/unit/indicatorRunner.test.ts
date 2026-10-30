// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runIndicator } from "../../src/webview/indicatorRunner";

let worker: FakeWorker;
class FakeWorker {
  terminate = vi.fn();
  postMessage = vi.fn();
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: { message: string; preventDefault: () => void }) => void;
  constructor() { worker = this; }
}
const bars = [{ time: 1, open: 100, high: 110, low: 90, close: 105, volume: 1 }];
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:indicator-test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("indicator Worker lifecycle", () => {
  it("validates returned plots and releases the Worker and blob", async () => {
    const pending = runIndicator("function calculate() {}", bars, new AbortController().signal);
    worker.onmessage!({ data: { plots: [{ name: "Custom", data: [{ time: 1, value: 105 }] }] } });
    await expect(pending).resolves.toMatchObject([{ name: "Custom", data: [{ time: 1, value: 105 }] }]);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:indicator-test");
  });
  it("terminates scripts that exceed the time limit", async () => {
    const failed = expect(runIndicator("while (true) {}", bars, new AbortController().signal)).rejects.toThrow("time limit");
    await vi.advanceTimersByTimeAsync(2000);
    await failed;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("cancels calculation when the chart is hidden or disposed", async () => {
    const controller = new AbortController();
    const failed = expect(runIndicator("function calculate() {}", bars, controller.signal)).rejects.toThrow("cancelled");
    controller.abort();
    await failed;
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("reports syntax errors and rejects invalid plot timestamps", async () => {
    const invalid = expect(runIndicator("not JavaScript", bars, new AbortController().signal)).rejects.toThrow("Syntax error");
    worker.onerror!({ message: "Syntax error", preventDefault: vi.fn() });
    await invalid;
    const invalidData = expect(runIndicator("function calculate() {}", bars, new AbortController().signal)).rejects.toThrow("existing candle times");
    worker.onmessage!({ data: { plots: [{ data: [{ time: 2, value: 10 }] }] } });
    await invalidData;
  });
});

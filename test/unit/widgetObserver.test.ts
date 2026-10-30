// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { observeWidget } from "../../src/webview/widgetObserver";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("main chart observation", () => {
  it("keeps quotes separated by ticker and venue when hidden widgets emit into tv.js shared callback", () => {
    vi.useFakeTimers(); vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    type Quote = { original_name: string; short_name: string; exchange: string };
    let shared: (value: Quote) => void = () => {};
    let interval = "240";
    const changed = vi.fn(), view = observeWidget({ ready: cb => cb(), getSymbolInfo: cb => cb({ name: "ETHUSDT", exchange: "Binance", interval }), subscribeToQuote: cb => { shared = cb; } }, changed);
    shared({ original_name: "BINANCE:ETHUSDT", short_name: "ETHUSDT", exchange: "Binance" });
    shared({ original_name: "BYBIT:ETHUSDT", short_name: "ETHUSDT", exchange: "Bybit" });
    interval = "60";
    shared({ original_name: "BATS_DLY:AAPL", short_name: "AAPL", exchange: "Cboe One" });
    expect(changed).toHaveBeenLastCalledWith("BINANCE:ETHUSDT", "60");
    view.remove();
  });
  it("reclaims tv.js shared quote callbacks on cached-chart activation and ignores late hidden readiness", () => {
    vi.useFakeTimers(); vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    type Quote = { original_name: string; short_name: string };
    let shared: (quote: Quote) => void = () => {}, lateReady: () => void = () => {};
    let firstInfo = { name: "ETHUSDT", interval: "240" };
    const first = { ready: (cb: () => void) => cb(), getSymbolInfo: (cb: (info: typeof firstInfo) => void) => cb(firstInfo), subscribeToQuote: (cb: typeof shared) => { shared = cb; } };
    const changed = vi.fn(), a = observeWidget(first, changed);
    shared({ original_name: "BINANCE:ETHUSDT", short_name: "ETHUSDT" });
    a.setVisible(false);
    const b = observeWidget({ ready: cb => { lateReady = cb; }, getSymbolInfo: cb => cb({ name: "AAPL", interval: "D" }), subscribeToQuote: cb => { shared = cb; } }, vi.fn());
    b.setVisible(false); a.setVisible(true);
    lateReady();
    firstInfo = { name: "MSFT", interval: "60" };
    shared({ original_name: "BATS_DLY:MSFT", short_name: "MSFT" });
    expect(changed).toHaveBeenLastCalledWith("BATS_DLY:MSFT", "60");
    a.remove(); b.remove(); expect(vi.getTimerCount()).toBe(0);
  });
  it("follows source and effective interval without rebuilding, pauses hidden charts and ignores late callbacks", () => {
    vi.useFakeTimers(); vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    let quote: (value: { original_name: string; short_name: string }) => void = () => {};
    let info = { name: "AAPL", interval: "1D" };
    const widget = { ready: (cb: () => void) => cb(), getSymbolInfo: vi.fn((cb: (value: typeof info) => void) => cb(info)), subscribeToQuote: (cb: typeof quote) => { quote = cb; }, remove: vi.fn() };
    const changed = vi.fn(), observed = observeWidget(widget, changed);
    quote({ original_name: "BATS_DLY:AAPL", short_name: "AAPL" });
    expect(changed).toHaveBeenLastCalledWith("BATS_DLY:AAPL", "D");
    vi.advanceTimersByTime(2000); expect(changed).toHaveBeenCalledOnce();
    info = { name: "ETHUSDT", interval: "240" }; vi.advanceTimersByTime(2000);
    expect(changed).toHaveBeenCalledOnce(); // old quote must not be paired with a new symbol
    quote({ original_name: "BINANCE:ETHUSDT", short_name: "ETHUSDT" });
    expect(changed).toHaveBeenLastCalledWith("BINANCE:ETHUSDT", "240");
    observed.setVisible(false); const count = widget.getSymbolInfo.mock.calls.length;
    vi.advanceTimersByTime(5000); expect(widget.getSymbolInfo).toHaveBeenCalledTimes(count);
    observed.remove(); quote({ original_name: "NASDAQ:MSFT", short_name: "MSFT" });
    expect(changed).toHaveBeenCalledTimes(2); expect(widget.remove).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
});

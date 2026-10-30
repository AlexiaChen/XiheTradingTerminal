import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type WebSocket from "ws";
import { WidgetFeed } from "../../src/marketData/widgetFeed";
import { WidgetFrameDecoder, widgetCommand, widgetFrame, type FeedEvent } from "../../src/marketData/widgetProtocol";

class Socket extends EventEmitter {
  readyState = 1;
  send = vi.fn();
  terminate = vi.fn(() => { this.readyState = 3; this.emit("close"); });
  message(m: string, p: unknown[]) { this.emit("message", Buffer.from(widgetCommand(m, p))); }
  commands() { return this.send.mock.calls.flatMap(call => new WidgetFrameDecoder().push(call[0]).filter(s => !s.startsWith("~h~")).map(s => JSON.parse(s))); }
  session() { return this.commands().find(command => command.m === "chart_create_session").p[0]; }
}
let sockets: Socket[], events: FeedEvent[], feed: WidgetFeed;
beforeEach(() => {
  vi.useFakeTimers(); sockets = []; events = [];
  feed = new WidgetFeed({ id: "p1", symbol: "NASDAQ:AAPL", interval: "D", auxiliary: ["1m"] }, event => events.push(event), {
    createSocket: () => { const socket = new Socket(); sockets.push(socket); return socket as unknown as WebSocket; }
  });
});
afterEach(() => { feed.dispose(); vi.useRealTimers(); });
function load(socket: Socket, session = socket.session()) {
  socket.message("symbol_resolved", [session, "symbol_1", { full_name: "BATS_DLY:AAPL", exchange: "Cboe One", timezone: "America/New_York", session: "0930-1600", pricescale: 100, minmov: 1 }]);
  socket.message("timescale_update", [session, { s1: { s: [{ i: 0, v: [1000, 100, 110, 90, 105, 10] }] } }]);
  socket.message("series_completed", [session, "s1", "delayed_streaming_900"]);
}
describe("native read-only Widget feed", () => {
  it("subscribes anonymously, echoes heartbeats and resolves auxiliary data to the actual main source", () => {
    const socket = sockets[0]; socket.emit("open");
    expect(socket.commands()[0]).toEqual({ m: "set_auth_token", p: ["unauthorized_user_token"] });
    socket.emit("message", Buffer.from(widgetFrame("~h~42")));
    expect(socket.send).toHaveBeenLastCalledWith(widgetFrame("~h~42"));
    load(socket);
    expect(events).toContainEqual(expect.objectContaining({ kind: "series", reset: true, info: expect.objectContaining({ requestedSymbol: "NASDAQ:AAPL", symbol: "BATS_DLY:AAPL", status: "delayed_streaming_900" }) }));
    const resolutions = socket.commands().filter(command => command.m === "resolve_symbol");
    expect(JSON.parse(resolutions[1].p[2].slice(1)).symbol).toBe("BATS_DLY:AAPL");
    expect(socket.commands().filter(command => command.m === "create_series")[1].p.slice(4, 6)).toEqual(["1", 12_000]);
  });
  it("coalesces forming-bar updates into bounded deltas and resets historical index revisions", async () => {
    const socket = sockets[0]; socket.emit("open"); load(socket); const session = socket.session();
    socket.message("du", [session, { s1: { s: [{ i: 0, v: [1000, 100, 110, 90, 106, 11] }] } }]);
    socket.message("du", [session, { s1: { s: [{ i: 0, v: [1000, 100, 110, 90, 107, 12] }] } }]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(events.at(-1)).toMatchObject({ kind: "series", reset: false, bars: [{ time: 1000, close: 107 }] });
    socket.message("du", [session, { s1: { s: [{ i: 0, v: [1001, 100, 110, 90, 108, 12] }] } }]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(events.at(-1)).toMatchObject({ kind: "series", reset: true, bars: [{ time: 1001 }] });
  });
  it("reconnects with fresh sessions/history, rejects old sockets and leaves no timers after disposal", async () => {
    const old = sockets[0]; old.emit("open"); load(old); old.terminate();
    expect(events.at(-1)).toMatchObject({ kind: "status", state: "reconnecting" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(sockets).toHaveLength(2); const next = sockets[1]; next.emit("open");
    expect(next.session()).not.toBe(old.session());
    const count = events.length; load(old); expect(events).toHaveLength(count);
    load(next); expect(events.at(-1)).toMatchObject({ kind: "series", reset: true });
    feed.dispose(); expect(vi.getTimerCount()).toBe(0);
  });
  it("reports unavailable symbols and does not redirect them to Binance or another instrument", () => {
    const socket = sockets[0]; socket.emit("open");
    socket.message("symbol_error", [socket.session(), "symbol_1", "permission_denied"]);
    expect(events.at(-1)).toMatchObject({ kind: "status", state: "error", message: expect.stringContaining("unavailable") });
    expect(socket.commands().filter(command => command.m === "resolve_symbol")).toHaveLength(1);
  });
  it("terminates silent connections and retries rather than showing them as live", async () => {
    await vi.advanceTimersByTimeAsync(50_000);
    expect(sockets[0].terminate).toHaveBeenCalledOnce();
    expect(events.at(-1)).toMatchObject({ kind: "status", state: "reconnecting" });
  });
});

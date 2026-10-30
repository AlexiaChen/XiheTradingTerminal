import WebSocket from "ws";
import { HttpsProxyAgent } from "https-proxy-agent";
import { transportError, type FeedLogger } from "../feedDiagnostics";
import { AUX_INTERVALS, object, WidgetFrameDecoder, widgetCommand, widgetFrame, WidgetSeries, type FeedEvent, type FeedRequest, type SymbolInfo, type WireCandle } from "./widgetProtocol";

const ENDPOINT = "wss://widgetdata.tradingview.com/socket.io/websocket?from=widgetembed%2F&api_key=tradingview";
type Stream = { resolution: string; session: string; series: WidgetSeries; ready: boolean; info: SymbolInfo; changes: Map<number, WireCandle>; reset: boolean };
export type FeedOptions = { proxy?: string; createSocket?: () => WebSocket; log?: FeedLogger };

/** Read-only, anonymous Widget feed. No accounts, cookies, private entitlements or order methods. */
export class WidgetFeed {
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private watchdog?: ReturnType<typeof setInterval>;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private readonly dirty = new Set<Stream>();
  private stopped = false;
  private attempts = 0;
  private lastReceived = Date.now();
  private streams = new Map<string, Stream>();

  constructor(private readonly request: FeedRequest, private readonly emit: (event: FeedEvent) => void, private readonly options: FeedOptions = {}) { this.connect(); }

  private connect() {
    if (this.stopped) { return; }
    this.emit({ kind: "status", state: this.attempts ? "reconnecting" : "connecting", message: "Connecting to the hosted Widget feed…" });
    this.streams.clear(); this.dirty.clear();
    this.options.log?.(`Socket connecting attempt=${this.attempts + 1}`);
    const decoder = new WidgetFrameDecoder();
    let socket: WebSocket;
    try {
      socket = this.options.createSocket?.() ?? new WebSocket(ENDPOINT, {
        origin: "https://s.tradingview.com", handshakeTimeout: 15_000, maxPayload: 4_000_000,
        ...(this.options.proxy ? { agent: new HttpsProxyAgent(this.options.proxy) } : {})
      });
    } catch (error) { this.retry(`Could not open the Widget connection (${transportError(error)}). Check the VS Code HTTP proxy.`); return; }
    this.socket = socket;
    this.lastReceived = Date.now();
    let failure = "";
    socket.on("open", () => {
      if (this.stopped || socket !== this.socket) { return; }
      this.options.log?.("Socket open; anonymous authentication and history request");
      this.send("set_auth_token", ["unauthorized_user_token"]);
      this.subscribe("main", this.request.interval, 1000);
    });
    socket.on("message", bytes => {
      if (this.stopped || socket !== this.socket) { return; }
      this.lastReceived = Date.now();
      try {
        for (const payload of decoder.push(bytes.toString())) {
          if (payload.startsWith("~h~")) { socket.send(widgetFrame(payload)); continue; }
          this.message(object(JSON.parse(payload)));
        }
      } catch (error) {
        this.emit({ kind: "status", state: "error", message: error instanceof Error ? error.message : "Unsupported Widget data." });
        socket.terminate();
      }
    });
    socket.on("error", error => {
      if (this.stopped || socket !== this.socket) { return; }
      failure = transportError(error);
      this.options.log?.(`Socket error: ${failure}`);
    });
    socket.on("close", (code: number) => {
      if (socket === this.socket && !this.stopped) {
        this.options.log?.(`Socket closed code=${code ?? "unknown"}`);
        this.retry(`Widget feed disconnected${failure ? ` (${failure})` : ""}. Reconnecting and reloading history…`);
      }
    });
    this.watchdog = setInterval(() => {
      if (Date.now() - this.lastReceived > 45_000) { failure = "No Widget messages for 45 seconds"; this.options.log?.(failure); socket.terminate(); }
    }, 10_000);
  }

  private subscribe(resolution: string, interval: string, count: number) {
    const session = `cs_xihe_${Math.random().toString(36).slice(2, 14)}`;
    const stream: Stream = { resolution, session, series: new WidgetSeries(count), ready: false, changes: new Map(), reset: false, info: {
      requestedSymbol: this.request.symbol, symbol: this.request.symbol, interval, exchange: "", description: "",
      timezone: "UTC", session: "", minTick: 0.01, status: "loading", volumeAvailable: false
    } };
    this.streams.set(session, stream);
    const symbol = resolution === "main" ? this.request.symbol : [...this.streams.values()].find(s => s.resolution === "main")!.info.symbol;
    this.send("chart_create_session", [session, ""]);
    this.send("resolve_symbol", [session, "symbol_1", `=${JSON.stringify({ symbol, adjustment: "splits", session: "regular" })}`]);
    this.send("create_series", [session, "s1", "s1", "symbol_1", interval, count, ""]);
  }

  private message(message: Record<string, unknown>) {
    if (typeof message.m !== "string" || !Array.isArray(message.p)) { return; }
    const p = message.p, stream = this.streams.get(String(p[0]));
    if (message.m === "critical_error" || message.m === "protocol_error") { throw new Error("The hosted Widget rejected this protocol. Retry later."); }
    if (!stream) { return; }
    if (["symbol_error", "series_error"].includes(message.m)) {
      stream.info.status = "unavailable";
      this.emit({ kind: "status", state: "error", message: `${stream.resolution}: this symbol or timeframe is unavailable in the hosted Widget feed. Use another symbol or timeframe.` });
      return;
    }
    if (message.m === "symbol_resolved") {
      const info = object(p[2]), scale = Number(info.pricescale), move = Number(info.minmov);
      const symbol = typeof info.full_name === "string" ? info.full_name : this.request.symbol;
      const main = [...this.streams.values()].find(s => s.resolution === "main");
      if (stream.resolution !== "main" && main && symbol !== main.info.symbol) { throw new Error("Auxiliary Widget source differs from the main source."); }
      Object.assign(stream.info, { symbol, exchange: String(info.exchange ?? ""), description: String(info.description ?? ""), timezone: String(info.timezone ?? "UTC"), session: String(info.session ?? ""), minTick: scale > 0 && move > 0 ? move / scale : 0.01 });
    }
    if (message.m === "timescale_update" || message.m === "du") {
      const series = object(object(p[1]).s1);
      const incoming = stream.series.update(series.s);
      stream.reset ||= stream.series.revision;
      for (const bar of incoming) { stream.changes.set(bar.time, bar); }
      if (incoming.length && stream.ready) {
        this.dirty.add(stream);
        // Bound IPC/render/Worker cost while retaining every incoming bar revision.
        this.flushTimer ??= setTimeout(() => { this.flushTimer = undefined; this.flush(); }, 1000);
      }
    }
    if (message.m === "series_completed") {
      stream.ready = true; stream.info.status = typeof p[2] === "string" ? p[2] : "unknown";
      this.attempts = 0;
      this.publish(stream);
      if (stream.resolution === "main" && this.streams.size === 1) {
        for (const resolution of this.request.auxiliary) { this.subscribe(resolution, AUX_INTERVALS[resolution], 12_000); }
      }
    }
  }

  private publish(stream: Stream, initial = true) {
    const snapshot = stream.series.snapshot(), reset = initial || stream.reset;
    if (!snapshot.length) { this.emit({ kind: "status", state: "error", message: `${stream.resolution}: no candles were returned.` }); return; }
    stream.info.volumeAvailable = snapshot.every(bar => bar.volume !== null);
    const bars = reset ? snapshot : [...stream.changes.values()].sort((a, b) => a.time - b.time);
    stream.changes.clear(); stream.reset = false;
    this.emit({ kind: "series", resolution: stream.resolution, reset, bars, info: { ...stream.info } });
  }
  private flush() { for (const stream of this.dirty) { this.publish(stream, false); } this.dirty.clear(); }
  private send(method: string, params: unknown[]) { if (this.socket?.readyState === WebSocket.OPEN) { this.socket.send(widgetCommand(method, params)); } }
  private retry(message: string) {
    clearInterval(this.watchdog); clearTimeout(this.flushTimer); this.flushTimer = undefined;
    this.dirty.clear();
    this.emit({ kind: "status", state: "reconnecting", message });
    clearTimeout(this.reconnectTimer);
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(this.attempts++, 5));
    this.options.log?.(`Retry in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
  dispose() {
    this.stopped = true;
    clearTimeout(this.reconnectTimer); clearInterval(this.watchdog); clearTimeout(this.flushTimer);
    this.dirty.clear(); this.socket?.terminate(); this.socket = undefined;
  }
}

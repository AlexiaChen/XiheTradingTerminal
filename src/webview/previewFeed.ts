import type { FeedEvent, FeedRequest } from "../marketData/widgetProtocol";
import { isHostMessage } from "./hostMessages";

let sequence = 0;
/** One subscription belongs to one cached preview; stale/hidden replies never reach another chart. */
export function subscribePreview(request: Omit<FeedRequest, "id">, send: (message: unknown) => void, receive: (event: FeedEvent) => void) {
  const id = `preview-${Date.now()}-${++sequence}`;
  const received = new Set<string>();
  const report = (diagnostic: { stage: "rendered"; bars: number } | { stage: "renderError"; message: string }) => send({ type: "previewDiagnostic", id, ...diagnostic });
  const start = () => send({ type: "previewSubscribe", id, ...request });
  const listener = (event: MessageEvent) => {
    if (!isHostMessage(event)) { return; }
    if (event.data?.type === "previewResume") { start(); }
    if (event.data?.type === "previewFeed" && event.data.id === id) {
      const update: FeedEvent = event.data.event;
      if (update.kind === "series" && !received.has(update.resolution)) {
        received.add(update.resolution);
        send({ type: "previewDiagnostic", id, stage: "received", resolution: update.resolution, bars: update.bars.length });
      }
      receive(update);
    }
  };
  window.addEventListener("message", listener); start();
  return { report, stop: () => { window.removeEventListener("message", listener); send({ type: "previewStop", id }); } };
}

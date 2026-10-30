import type { FeedEvent, FeedRequest } from "../marketData/widgetProtocol";

let sequence = 0;
/** One subscription belongs to one cached preview; stale/hidden replies never reach another chart. */
export function subscribePreview(request: Omit<FeedRequest, "id">, send: (message: unknown) => void, receive: (event: FeedEvent) => void) {
  const id = `preview-${Date.now()}-${++sequence}`;
  const start = () => send({ type: "previewSubscribe", id, ...request });
  const listener = (event: MessageEvent) => {
    if (event.source && event.source !== window) { return; }
    if (event.data?.type === "previewResume") { start(); }
    if (event.data?.type === "previewFeed" && event.data.id === id) { receive(event.data.event); }
  };
  window.addEventListener("message", listener); start();
  return () => { window.removeEventListener("message", listener); send({ type: "previewStop", id }); };
}

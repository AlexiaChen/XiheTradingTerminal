/** VS Code forwards host messages from its same-origin outer Webview frame.
 * Its API shim masks window.parent, so event.source need not equal window.
 * TradingView frames have another origin and must never send host commands.
 */
export function isHostMessage(event: MessageEvent): boolean {
  return event.origin === window.origin;
}

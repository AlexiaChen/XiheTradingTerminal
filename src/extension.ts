import * as vscode from "vscode";
import { TradingViewProvider } from "./tradingViewProvider";

export function activate(context: vscode.ExtensionContext) {
  // 🔍 Proof of activation (check DevTools console)
  console.log("✅ XiheTradingTerminal extension activated");

  const provider = new TradingViewProvider(
    context.extensionUri,
    context.workspaceState
  );

  // Register the sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "xihe-trading-terminal.sidebar", // MUST match package.json
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // Optional: reload command (useful for debugging)
  context.subscriptions.push(
    vscode.commands.registerCommand("xihe-trading-terminal.reload", () => {
      console.log("🔄 XiheTradingTerminal reload command executed");
      provider.reload();
      vscode.window.showInformationMessage("XiheTradingTerminal reloaded");
    })
  );
}

export function deactivate() {
  // Optional cleanup hook
}

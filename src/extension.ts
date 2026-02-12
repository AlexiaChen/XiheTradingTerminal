import * as vscode from "vscode";
import { TradingViewProvider } from "./tradingViewProvider";

export function activate(context: vscode.ExtensionContext) {
  // 🔍 Proof of activation (check DevTools console)
  console.log("✅ TradingView Sidebar extension activated");

  const provider = new TradingViewProvider(
    context.extensionUri,
    context.workspaceState
  );

  // Register the sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "tradingview.sidebar", // MUST match package.json
      provider
    )
  );

  // Optional: reload command (useful for debugging)
  context.subscriptions.push(
    vscode.commands.registerCommand("tradingview.reload", () => {
      console.log("🔄 TradingView reload command executed");
      provider.reload();
      vscode.window.showInformationMessage("TradingView sidebar reloaded");
    })
  );
}

export function deactivate() {
  // Optional cleanup hook
}

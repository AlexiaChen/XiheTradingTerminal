import * as vscode from "vscode";
import { TradingViewProvider } from "./tradingViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel("XiheTradingTerminal", { log: true });
  context.subscriptions.push(log);
  log.info(`Activated version=${context.extension.packageJSON.version} platform=${process.platform} node=${process.version} remote=${vscode.env.remoteName ?? "local"}`);

  const provider = new TradingViewProvider(
    context.extensionUri,
    context.workspaceState,
    log
  );

  // Register the sidebar webview
  context.subscriptions.push(
    provider,
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
      log.info("Reload Sidebar requested");
      provider.reload();
      vscode.window.showInformationMessage("XiheTradingTerminal reloaded");
    })
  );
}

export function deactivate() {
  // Optional cleanup hook
}

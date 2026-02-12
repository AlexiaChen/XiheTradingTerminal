# TradingView Sidebar

Embed TradingView charts directly in the VS Code Activity Bar and keep market context next to your code.

## Features

- Tabbed chart workspace inside a dedicated VS Code sidebar view.
- Per-tab chart configuration:
  - Symbol (`EXCHANGE:TICKER`)
  - Interval
  - Indicators/studies list
  - Light or dark theme
- Collapsible settings header to maximize chart space.
- Settings toggle in the same row as chart tabs for fast access.
- Workspace persistence: tabs and chart settings are restored when you reopen the workspace.
- TradingView-like styling for a more seamless UI with the embedded widget.

## Why This Extension

When you are building trading tools, automation, analytics, or just monitoring price action while coding, switching between browser tabs and editor windows adds friction. This extension keeps your chart layout visible where you work.

## Requirements

- Visual Studio Code `1.108.1` or newer.
- Internet access to load the TradingView widget assets.

## Installation

1. Install from the VS Code Marketplace (or package locally).
2. Open the **TradingView** icon in the Activity Bar.
3. Use the **Chart** view to start charting.

## Usage

1. Open the TradingView sidebar view.
2. Use `+ Chart` to create additional tabs.
3. Switch tabs to maintain different instruments/setups.
4. Use **Hide Settings** / **Show Settings** to collapse or expand the header controls.
5. Update symbol, interval, studies, and theme from the settings panel.

Changes are automatically saved to workspace state.

## Commands

- `TradingView: Reload Sidebar`
  - Command ID: `tradingview.reload`

## Extension Settings

This extension currently does not contribute custom VS Code settings.

## Known Issues

- TradingView content depends on network availability.
- Some advanced TradingView capabilities are constrained by the embedded widget API.
- Symbol availability depends on the data feeds exposed by TradingView.

## Privacy

The extension persists chart workspace data locally in VS Code workspace state. It does not add telemetry by itself.

## Release Notes

### 0.0.1

- Initial public release.
- Added tabbed TradingView sidebar charts.
- Added workspace persistence for chart tabs and settings.
- Added collapsible settings header with in-row toggle button.
- Updated UI styling to better match TradingView widget visuals.

## Contributing

Issues and pull requests are welcome.


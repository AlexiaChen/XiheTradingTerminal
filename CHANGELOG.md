# Change Log

## [0.0.2] - 2026-10-29

- Added named chart workspaces and chart-tab renaming, with migration of the original saved tabs.
- Keep chart instances alive when switching tabs/workspaces so in-session indicator adjustments remain intact.
- Include ZigZag (5%, 10) and Simple Moving Average (90) on every new chart; preserve existing additional indicators.
- Apply Gruvbox Dark/Light styling, mist-blue up candles, and wheat-gold down candles.
- Added 6h/8h request options and documented the hosted widget's observed fallback to 1D.
- Adopt Vite 8, Tailwind CSS 4, TypeScript 6, Vitest 5, ESLint 10, and an ES2024/Node.js 22 extension target.
- Add a local VSIX packaging command, offline regression tests and GitHub Actions with VSIX artifacts.
- Stop tracking installed dependencies and generated bundles/packages. Add contributor guidance, context documentation, and updated screenshots.

## [0.0.1] - 2026-02-12

- Initial public release with tabbed sidebar charts, per-tab configuration, workspace persistence, and collapsible settings.

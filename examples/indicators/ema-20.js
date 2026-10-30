// Load this file from the Lightweight Charts tab. No imports, Node.js APIs or Pine Script.
function calculate(bars) {
  const length = 20;
  const alpha = 2 / (length + 1);
  let value;
  const data = bars.map(bar => {
    value = value === undefined ? bar.close : alpha * bar.close + (1 - alpha) * value;
    return { time: bar.time, value };
  });
  return [{ name: "EMA 20", color: "#b8bb26", data }];
}

import { describe, expect, it } from "vitest";
import { indicatorDataRequirements } from "../../src/marketData/indicatorData";
describe("selected Widget auxiliary streams", () => {
  it("requests only selected streams and rejects invalid HTF combinations", () => {
    expect(indicatorDataRequirements(["macd", "liquidity-sweeps"], "240")).toEqual([]);
    expect(indicatorDataRequirements(["nomada-levels"], "360")).toEqual([]);
    expect(indicatorDataRequirements(["nomada-levels"], "240")).toEqual(["4h", "1d", "1w"]);
    expect(indicatorDataRequirements(["volume-delta", "volume-nodes"], "15")).toEqual(["1m"]);
    expect(indicatorDataRequirements(["volume-nodes"], "240")).toEqual(["15m"]);
  });
});

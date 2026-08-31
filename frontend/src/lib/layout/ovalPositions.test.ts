import { describe, expect, it } from "vitest";
import { computeOpponentPositions } from "./ovalPositions";

describe("computeOpponentPositions", () => {
  it("places the sole opponent at top for 2 players", () => {
    const positions = computeOpponentPositions(0, 2);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({ seatIndex: 1, label: "top" });
  });

  it("places opponents top-left/top-right for 3 players, in clockwise order", () => {
    const positions = computeOpponentPositions(0, 3);
    expect(positions.map((p) => p.seatIndex)).toEqual([1, 2]);
    expect(positions.map((p) => p.label)).toEqual(["top-left", "top-right"]);
  });

  it("places opponents left/top/right for 4 players, in clockwise order", () => {
    const positions = computeOpponentPositions(0, 4);
    expect(positions.map((p) => p.seatIndex)).toEqual([1, 2, 3]);
    expect(positions.map((p) => p.label)).toEqual(["left", "top", "right"]);
  });

  it("rotates the clockwise order to start after my own seat", () => {
    const positions = computeOpponentPositions(2, 4);
    expect(positions.map((p) => p.seatIndex)).toEqual([3, 0, 1]);
    expect(positions.map((p) => p.label)).toEqual(["left", "top", "right"]);
  });

  it("wraps correctly when my seat is the last index", () => {
    const positions = computeOpponentPositions(3, 4);
    expect(positions.map((p) => p.seatIndex)).toEqual([0, 1, 2]);
  });

  it("throws for an out-of-range seat count", () => {
    expect(() => computeOpponentPositions(0, 1)).toThrow();
    expect(() => computeOpponentPositions(0, 5)).toThrow();
  });
});

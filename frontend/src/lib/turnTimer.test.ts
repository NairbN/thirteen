import { describe, expect, it } from "vitest";
import { remainingFraction, remainingMs } from "./turnTimer";

describe("remainingMs", () => {
  it("returns the ms until the deadline", () => {
    expect(remainingMs(10_000, 4_000)).toBe(6_000);
  });

  it("clamps to zero once the deadline has passed", () => {
    expect(remainingMs(1_000, 5_000)).toBe(0);
  });
});

describe("remainingFraction", () => {
  it("returns 1 at the start of the timer", () => {
    expect(remainingFraction(30_000, 0, 30_000)).toBe(1);
  });

  it("returns 0.5 halfway through", () => {
    expect(remainingFraction(30_000, 15_000, 30_000)).toBe(0.5);
  });

  it("clamps to 0 after expiry", () => {
    expect(remainingFraction(30_000, 45_000, 30_000)).toBe(0);
  });
});

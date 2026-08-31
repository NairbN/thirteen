import { describe, expect, it } from "vitest";
import { parseCard } from "@/lib/rules-engine/cards";
import { cardLabel } from "./cardDisplay";

describe("cardLabel", () => {
  it("labels 3S as black spade", () => {
    expect(cardLabel(parseCard("3S"))).toEqual({ rank: "3", suit: "S", glyph: "♠", isRed: false });
  });

  it("labels 2H as red heart", () => {
    expect(cardLabel(parseCard("2H"))).toEqual({ rank: "2", suit: "H", glyph: "♥", isRed: true });
  });

  it("labels 10D as red diamond", () => {
    expect(cardLabel(parseCard("10D"))).toEqual({ rank: "10", suit: "D", glyph: "♦", isRed: true });
  });

  it("labels AC as black club", () => {
    expect(cardLabel(parseCard("AC"))).toEqual({ rank: "A", suit: "C", glyph: "♣", isRed: false });
  });
});

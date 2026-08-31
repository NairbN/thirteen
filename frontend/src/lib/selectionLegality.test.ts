import { describe, expect, it } from "vitest";
import { parseCard } from "@/lib/rules-engine/cards";
import { parseCombo } from "@/lib/rules-engine/combos";
import { evaluateSelection } from "./selectionLegality";

describe("evaluateSelection", () => {
  it("treats any valid combo as legal on an empty pile (awaiting_lead)", () => {
    const result = evaluateSelection([parseCard("7S")], "awaiting_lead", null);
    expect(result.legal).toBe(true);
    expect(result.combo?.type).toBe("single");
  });

  it("rejects an unparseable selection on lead", () => {
    const result = evaluateSelection([parseCard("7S"), parseCard("8D")], "awaiting_lead", null);
    expect(result.legal).toBe(false);
    expect(result.combo).toBeNull();
  });

  it("requires a pile to follow against", () => {
    const result = evaluateSelection([parseCard("7S")], "awaiting_follow", null);
    expect(result.legal).toBe(false);
  });

  it("allows a higher single to beat the pile", () => {
    const pile = parseCombo([parseCard("7S")]);
    const result = evaluateSelection([parseCard("7H")], "awaiting_follow", pile);
    expect(result.legal).toBe(true);
  });

  it("rejects a lower single against the pile", () => {
    const pile = parseCombo([parseCard("7H")]);
    const result = evaluateSelection([parseCard("7S")], "awaiting_follow", pile);
    expect(result.legal).toBe(false);
  });

  it("rejects a type mismatch against the pile", () => {
    const pile = parseCombo([parseCard("9S"), parseCard("9C")]);
    const result = evaluateSelection(
      [parseCard("10S"), parseCard("JC"), parseCard("QD")],
      "awaiting_follow",
      pile,
    );
    expect(result.legal).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCard } from "./cards";
import { beats, parseCombo, type ComboType } from "./combos";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, "../../../../fixtures/combo-cases.json");

interface AcceptCase {
  cards: string[];
  type: ComboType;
  length: number;
  high: string;
  isBomb?: boolean;
}
interface RejectCase {
  cards: string[];
  reason: string;
}
interface BeatsCase {
  pile: string[];
  candidate: string[];
  result: boolean;
  reason: string;
}
interface Fixture {
  parseCombo: { accept: AcceptCase[]; reject: RejectCase[] };
  beats: BeatsCase[];
}

const fixture: Fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));

describe("parseCombo accepts", () => {
  it.each(fixture.parseCombo.accept)("$cards -> $type", (testCase) => {
    const cards = testCase.cards.map(parseCard);
    const combo = parseCombo(cards);

    expect(combo).not.toBeNull();
    expect(combo?.type).toBe(testCase.type);
    expect(combo?.length).toBe(testCase.length);
    expect(combo?.high).toBe(parseCard(testCase.high));
    expect(combo?.isBomb).toBe(testCase.isBomb ?? false);
  });
});

describe("parseCombo rejects", () => {
  it.each(fixture.parseCombo.reject)("$cards ($reason)", (testCase) => {
    const cards = testCase.cards.map(parseCard);
    expect(parseCombo(cards)).toBeNull();
  });
});

describe("beats", () => {
  it.each(fixture.beats)("$pile vs $candidate -> $result ($reason)", (testCase) => {
    const pile = parseCombo(testCase.pile.map(parseCard));
    const candidate = parseCombo(testCase.candidate.map(parseCard));

    expect(pile).not.toBeNull();
    expect(candidate).not.toBeNull();
    if (pile && candidate) {
      expect(beats(candidate, pile)).toBe(testCase.result);
    }
  });
});

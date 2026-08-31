import { RANKS, SUITS, cardRank, cardSuit, type Card } from "@/lib/rules-engine/cards";

const SUIT_GLYPHS: Record<(typeof SUITS)[number], string> = {
  S: "♠",
  C: "♣",
  D: "♦",
  H: "♥",
};

const RED_SUITS = new Set<(typeof SUITS)[number]>(["D", "H"]);

export interface CardLabel {
  rank: string;
  suit: (typeof SUITS)[number];
  glyph: string;
  isRed: boolean;
}

export function cardLabel(card: Card): CardLabel {
  const rank = RANKS[cardRank(card)];
  const suit = SUITS[cardSuit(card)];
  return { rank, suit, glyph: SUIT_GLYPHS[suit], isRed: RED_SUITS.has(suit) };
}

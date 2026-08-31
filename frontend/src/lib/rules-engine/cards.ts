/**
 * Canonical card encoding. See doc/rules.md#canonical-encoding.
 *
 * Card = number, 0-51. id = rank * 4 + suit.
 * Rank order (low to high): 3 4 5 6 7 8 9 10 J Q K A 2
 * Suit order (low to high): S(pades) C(lubs) D(iamonds) H(earts)
 */
export type Card = number;

export const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"] as const;
export const SUITS = ["S", "C", "D", "H"] as const;

export const TWO_RANK = RANKS.indexOf("2");

export function cardRank(card: Card): number {
  return Math.floor(card / 4);
}

export function cardSuit(card: Card): number {
  return card % 4;
}

/** Parse fixture/test notation like '3S', '10H', 'AS', '2C' into a Card id. */
export function parseCard(notation: string): Card {
  const suit = notation.slice(-1);
  const rank = notation.slice(0, -1);
  return RANKS.indexOf(rank as (typeof RANKS)[number]) * 4 + SUITS.indexOf(suit as (typeof SUITS)[number]);
}

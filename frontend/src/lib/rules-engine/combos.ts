import { TWO_RANK, cardRank, type Card } from "./cards";

export type ComboType = "single" | "pair" | "triple" | "straight" | "quad" | "consecutive_pairs";

export interface Combo {
  type: ComboType;
  cards: Card[];
  length: number;
  high: Card;
  isBomb: boolean;
}

const BOMB_TYPES: ComboType[] = ["quad", "consecutive_pairs"];

// Exact chop table: pile length (of rank-2 cards) -> allowed [type, length] bombs.
const TWO_CHOPS: Record<number, [ComboType, number][]> = {
  1: [
    ["quad", 4],
    ["consecutive_pairs", 3],
  ],
  2: [["consecutive_pairs", 4]],
  3: [["consecutive_pairs", 5]],
};

function isConsecutive(ranks: number[]): boolean {
  return ranks.every((rank, i) => i === 0 || rank - ranks[i - 1] === 1);
}

export function parseCombo(cards: Card[]): Combo | null {
  if (cards.length === 0 || new Set(cards).size !== cards.length) {
    return null;
  }

  const sortedCards = [...cards].sort((a, b) => a - b);
  const rankGroups = new Map<number, Card[]>();
  for (const card of sortedCards) {
    const rank = cardRank(card);
    const group = rankGroups.get(rank);
    if (group) {
      group.push(card);
    } else {
      rankGroups.set(rank, [card]);
    }
  }

  const groupSizes = [...rankGroups.values()].map((g) => g.length);
  const uniqueRanks = [...rankGroups.keys()].sort((a, b) => a - b);
  const n = sortedCards.length;

  let type: ComboType;
  let length: number;

  if (n === 1) {
    type = "single";
    length = 1;
  } else if (n === 2 && rankGroups.size === 1) {
    type = "pair";
    length = 2;
  } else if (n === 3 && rankGroups.size === 1) {
    type = "triple";
    length = 3;
  } else if (n === 4 && rankGroups.size === 1) {
    type = "quad";
    length = 4;
  } else if (
    groupSizes.every((size) => size === 2) &&
    rankGroups.size >= 3 &&
    isConsecutive(uniqueRanks) &&
    !uniqueRanks.includes(TWO_RANK)
  ) {
    type = "consecutive_pairs";
    length = rankGroups.size;
  } else if (
    groupSizes.every((size) => size === 1) &&
    n >= 3 &&
    isConsecutive(uniqueRanks) &&
    !uniqueRanks.includes(TWO_RANK)
  ) {
    type = "straight";
    length = n;
  } else {
    return null;
  }

  return {
    type,
    cards: sortedCards,
    length,
    high: Math.max(...sortedCards),
    isBomb: BOMB_TYPES.includes(type),
  };
}

export function beats(candidate: Combo, pile: Combo): boolean {
  const pileIsAllTwos =
    (pile.type === "single" || pile.type === "pair" || pile.type === "triple") &&
    cardRank(pile.cards[0]) === TWO_RANK;

  if (pileIsAllTwos && candidate.isBomb) {
    const allowed = TWO_CHOPS[pile.length] ?? [];
    return allowed.some(([type, length]) => candidate.type === type && candidate.length === length);
  }

  if (pile.isBomb && candidate.isBomb) {
    if (pile.type === "quad" && candidate.type === "consecutive_pairs" && candidate.length === 3) {
      return true;
    }
    if (candidate.type === pile.type && candidate.length === pile.length) {
      return candidate.high > pile.high;
    }
    return false;
  }

  if (candidate.type === pile.type && candidate.length === pile.length) {
    return candidate.high > pile.high;
  }
  return false;
}

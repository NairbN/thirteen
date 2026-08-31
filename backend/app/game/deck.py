import random
from dataclasses import dataclass
from typing import Literal

from app.rules_engine.cards import TWO_RANK, Card, card_rank

InstantWinCategory = Literal["straight_3_to_a", "six_consecutive_pairs", "four_twos"]

INSTANT_WIN_STRENGTH: dict[InstantWinCategory, int] = {
    "straight_3_to_a": 3,
    "six_consecutive_pairs": 2,
    "four_twos": 1,
}


@dataclass(frozen=True)
class InstantWin:
    category: InstantWinCategory
    high_card: Card


def build_deck() -> list[Card]:
    return list(range(52))


def deal(
    seat_count: int, hand_size: int = 13, rng: random.Random | None = None
) -> list[list[Card]]:
    rng = rng or random.Random()
    deck = build_deck()
    rng.shuffle(deck)
    needed = seat_count * hand_size
    dealt = deck[:needed]
    return [sorted(dealt[i * hand_size : (i + 1) * hand_size]) for i in range(seat_count)]


def lowest_card_in_play(hands: list[list[Card]]) -> Card:
    return min(card for hand in hands for card in hand)


def _rank_counts(hand: list[Card]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for card in hand:
        counts[card_rank(card)] = counts.get(card_rank(card), 0) + 1
    return counts


def _straight_3_to_a(hand: list[Card], counts: dict[int, int]) -> InstantWin | None:
    if not all(counts.get(rank, 0) >= 1 for rank in range(TWO_RANK)):
        return None
    high = max(card for card in hand if card_rank(card) != TWO_RANK)
    return InstantWin(category="straight_3_to_a", high_card=high)


def _six_consecutive_pairs(hand: list[Card], counts: dict[int, int]) -> InstantWin | None:
    for start in range(0, TWO_RANK - 5):
        run = range(start, start + 6)
        if all(counts.get(rank, 0) >= 2 for rank in run):
            run_cards = [card for card in hand if card_rank(card) in run]
            return InstantWin(category="six_consecutive_pairs", high_card=max(run_cards))
    return None


def _four_twos(hand: list[Card], counts: dict[int, int]) -> InstantWin | None:
    if counts.get(TWO_RANK, 0) == 4:
        two_cards = [card for card in hand if card_rank(card) == TWO_RANK]
        return InstantWin(category="four_twos", high_card=max(two_cards))
    return None


def find_instant_win(hand: list[Card]) -> InstantWin | None:
    counts = _rank_counts(hand)
    return (
        _straight_3_to_a(hand, counts)
        or _six_consecutive_pairs(hand, counts)
        or _four_twos(hand, counts)
    )

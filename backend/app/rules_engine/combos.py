from dataclasses import dataclass
from enum import StrEnum

from app.rules_engine.cards import TWO_RANK, Card, card_rank


class ComboType(StrEnum):
    SINGLE = "single"
    PAIR = "pair"
    TRIPLE = "triple"
    STRAIGHT = "straight"
    QUAD = "quad"
    CONSECUTIVE_PAIRS = "consecutive_pairs"


BOMB_TYPES = (ComboType.QUAD, ComboType.CONSECUTIVE_PAIRS)

# Exact chop table: pile length (of rank-2 cards) -> allowed (type, length) bombs.
TWO_CHOPS: dict[int, set[tuple[ComboType, int]]] = {
    1: {(ComboType.QUAD, 4), (ComboType.CONSECUTIVE_PAIRS, 3)},
    2: {(ComboType.CONSECUTIVE_PAIRS, 4)},
    3: {(ComboType.CONSECUTIVE_PAIRS, 5)},
}


@dataclass(frozen=True)
class Combo:
    type: ComboType
    cards: tuple[Card, ...]
    length: int
    high: Card
    is_bomb: bool


def _is_consecutive(ranks: list[int]) -> bool:
    return all(ranks[i + 1] - ranks[i] == 1 for i in range(len(ranks) - 1))


def parse_combo(cards: list[Card]) -> Combo | None:
    if not cards or len(set(cards)) != len(cards):
        return None

    sorted_cards = sorted(cards)
    rank_groups: dict[int, list[Card]] = {}
    for c in sorted_cards:
        rank_groups.setdefault(card_rank(c), []).append(c)

    group_sizes = [len(g) for g in rank_groups.values()]
    unique_ranks = sorted(rank_groups.keys())
    n = len(sorted_cards)

    combo_type: ComboType
    length: int

    if n == 1:
        combo_type, length = ComboType.SINGLE, 1
    elif n == 2 and len(rank_groups) == 1:
        combo_type, length = ComboType.PAIR, 2
    elif n == 3 and len(rank_groups) == 1:
        combo_type, length = ComboType.TRIPLE, 3
    elif n == 4 and len(rank_groups) == 1:
        combo_type, length = ComboType.QUAD, 4
    elif (
        all(size == 2 for size in group_sizes)
        and len(rank_groups) >= 3
        and _is_consecutive(unique_ranks)
        and TWO_RANK not in unique_ranks
    ):
        combo_type, length = ComboType.CONSECUTIVE_PAIRS, len(rank_groups)
    elif (
        all(size == 1 for size in group_sizes)
        and n >= 3
        and _is_consecutive(unique_ranks)
        and TWO_RANK not in unique_ranks
    ):
        combo_type, length = ComboType.STRAIGHT, n
    else:
        return None

    return Combo(
        type=combo_type,
        cards=tuple(sorted_cards),
        length=length,
        high=max(sorted_cards),
        is_bomb=combo_type in BOMB_TYPES,
    )


def beats(candidate: Combo, pile: Combo) -> bool:
    pile_is_all_twos = pile.type in (
        ComboType.SINGLE,
        ComboType.PAIR,
        ComboType.TRIPLE,
    ) and card_rank(pile.cards[0]) == TWO_RANK

    if pile_is_all_twos and candidate.is_bomb:
        allowed = TWO_CHOPS.get(pile.length, set())
        return (candidate.type, candidate.length) in allowed

    if pile.is_bomb and candidate.is_bomb:
        if (
            pile.type == ComboType.QUAD
            and candidate.type == ComboType.CONSECUTIVE_PAIRS
            and candidate.length == 3
        ):
            return True
        if candidate.type == pile.type and candidate.length == pile.length:
            return candidate.high > pile.high
        return False

    if candidate.type == pile.type and candidate.length == pile.length:
        return candidate.high > pile.high
    return False

"""Canonical card encoding. See doc/rules.md#canonical-encoding.

Card = int, 0-51. id = rank * 4 + suit.
Rank order (low to high): 3 4 5 6 7 8 9 10 J Q K A 2
Suit order (low to high): S(pades) C(lubs) D(iamonds) H(earts)
"""

Card = int

RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"]
SUITS = ["S", "C", "D", "H"]

TWO_RANK = RANKS.index("2")


def card_rank(card: Card) -> int:
    return card // 4


def card_suit(card: Card) -> int:
    return card % 4


def parse_card(notation: str) -> Card:
    """Parse fixture/test notation like '3S', '10H', 'AS', '2C' into a Card id."""
    rank, suit = notation[:-1], notation[-1]
    return RANKS.index(rank) * 4 + SUITS.index(suit)

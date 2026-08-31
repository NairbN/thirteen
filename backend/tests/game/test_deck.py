import random

from app.game.deck import build_deck, deal, find_instant_win, lowest_card_in_play
from app.rules_engine.cards import parse_card


def test_build_deck_has_52_unique_cards() -> None:
    deck = build_deck()
    assert len(deck) == 52
    assert len(set(deck)) == 52


def test_deal_gives_each_seat_hand_size_cards() -> None:
    hands = deal(4, rng=random.Random(0))
    assert len(hands) == 4
    for hand in hands:
        assert len(hand) == 13


def test_deal_never_repeats_a_card() -> None:
    hands = deal(4, rng=random.Random(0))
    all_cards = [c for hand in hands for c in hand]
    assert len(set(all_cards)) == len(all_cards)


def test_deal_3_players_leaves_cards_out_of_play() -> None:
    hands = deal(3, rng=random.Random(0))
    assert sum(len(h) for h in hands) == 39


def test_lowest_card_in_play_is_3_spades_at_4_players() -> None:
    hands = deal(4, rng=random.Random(0))
    assert lowest_card_in_play(hands) == parse_card("3S")


def test_lowest_card_in_play_among_dealt_hands_only() -> None:
    hands = [[parse_card("5S"), parse_card("6S")], [parse_card("4C"), parse_card("7D")]]
    assert lowest_card_in_play(hands) == parse_card("4C")


def test_find_instant_win_straight_3_to_a() -> None:
    hand = [
        parse_card("3S"),
        parse_card("4S"),
        parse_card("5S"),
        parse_card("6S"),
        parse_card("7S"),
        parse_card("8S"),
        parse_card("9S"),
        parse_card("10S"),
        parse_card("JS"),
        parse_card("QS"),
        parse_card("KS"),
        parse_card("AS"),
        parse_card("2S"),
    ]
    result = find_instant_win(hand)
    assert result is not None
    assert result.category == "straight_3_to_a"
    assert result.high_card == parse_card("AS")


def test_find_instant_win_six_consecutive_pairs() -> None:
    hand = [
        parse_card("3S"),
        parse_card("3C"),
        parse_card("4S"),
        parse_card("4C"),
        parse_card("5S"),
        parse_card("5C"),
        parse_card("6S"),
        parse_card("6C"),
        parse_card("7S"),
        parse_card("7C"),
        parse_card("8S"),
        parse_card("8C"),
        parse_card("2D"),
    ]
    result = find_instant_win(hand)
    assert result is not None
    assert result.category == "six_consecutive_pairs"
    assert result.high_card == parse_card("8C")


def test_find_instant_win_four_twos() -> None:
    hand = [
        parse_card("2S"),
        parse_card("2C"),
        parse_card("2D"),
        parse_card("2H"),
        parse_card("3S"),
        parse_card("4S"),
        parse_card("5S"),
        parse_card("6S"),
        parse_card("7S"),
        parse_card("8S"),
        parse_card("9S"),
        parse_card("10S"),
        parse_card("JS"),
    ]
    result = find_instant_win(hand)
    assert result is not None
    assert result.category == "four_twos"


def test_find_instant_win_none_for_ordinary_hand() -> None:
    hand = [
        parse_card("3S"),
        parse_card("3C"),
        parse_card("5S"),
        parse_card("6S"),
        parse_card("7S"),
        parse_card("8S"),
        parse_card("9S"),
        parse_card("10S"),
        parse_card("JS"),
        parse_card("QS"),
        parse_card("KS"),
        parse_card("AS"),
        parse_card("2S"),
    ]
    assert find_instant_win(hand) is None


def test_instant_win_strength_ordering() -> None:
    from app.game.deck import INSTANT_WIN_STRENGTH

    assert (
        INSTANT_WIN_STRENGTH["straight_3_to_a"]
        > INSTANT_WIN_STRENGTH["six_consecutive_pairs"]
        > INSTANT_WIN_STRENGTH["four_twos"]
    )

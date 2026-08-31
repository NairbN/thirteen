import pytest

from app.game.game_engine import advance_turn, is_game_over, pass_turn, play, turn_timer_expired
from app.game.models import (
    Game,
    GameError,
    GamePhase,
    ParticipationState,
    Room,
    RoomState,
    Seat,
)
from app.rules_engine.cards import parse_card


def make_seat(index: int, hand: list[str], participation=ParticipationState.ACTIVE) -> Seat:
    return Seat(
        seat_index=index,
        session_token=f"tok{index}",
        username=f"p{index}",
        icon="cat",
        hand=[parse_card(c) for c in hand],
        participation=participation,
    )


def make_room(
    seats: list[Seat],
    *,
    phase: GamePhase = GamePhase.AWAITING_LEAD,
    current_seat: int = 0,
    pile=None,
    is_first_lead: bool = False,
    lowest_card_in_play: int = parse_card("3S"),
    last_player_to_play: int | None = None,
) -> Room:
    room = Room(code="ABCD", state=RoomState.IN_PROGRESS)
    room.seats = {s.seat_index: s for s in seats}
    room.game = Game(
        phase=phase,
        current_seat=current_seat,
        pile=pile,
        is_first_lead=is_first_lead,
        lowest_card_in_play=lowest_card_in_play,
        last_player_to_play=last_player_to_play,
    )
    return room


def test_play_rejects_wrong_turn() -> None:
    room = make_room([make_seat(0, ["3S", "4S"]), make_seat(1, ["5S"])], current_seat=0)
    with pytest.raises(GameError) as exc:
        play(room, 1, [parse_card("5S")])
    assert exc.value.code == "NOT_YOUR_TURN"


def test_play_rejects_cards_not_held() -> None:
    room = make_room([make_seat(0, ["3S", "4S"]), make_seat(1, ["5S"])], current_seat=0)
    with pytest.raises(GameError) as exc:
        play(room, 0, [parse_card("9S")])
    assert exc.value.code == "CARDS_NOT_HELD"


def test_play_rejects_illegal_combo_shape() -> None:
    room = make_room([make_seat(0, ["3S", "4C", "6D"]), make_seat(1, ["5S"])], current_seat=0)
    with pytest.raises(GameError) as exc:
        play(room, 0, [parse_card("3S"), parse_card("4C"), parse_card("6D")])
    assert exc.value.code == "ILLEGAL_PLAY"


def test_play_first_lead_must_include_lowest_card() -> None:
    room = make_room(
        [make_seat(0, ["3S", "4S"]), make_seat(1, ["5S"])],
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    with pytest.raises(GameError) as exc:
        play(room, 0, [parse_card("4S")])
    assert exc.value.code == "MUST_INCLUDE_LOWEST_CARD"


def test_play_successful_lead_advances_state() -> None:
    room = make_room(
        [make_seat(0, ["3S", "4S"]), make_seat(1, ["5S"])],
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    play(room, 0, [parse_card("3S")])

    assert room.game.phase == GamePhase.AWAITING_FOLLOW
    assert room.game.pile.high == parse_card("3S")
    assert room.game.last_player_to_play == 0
    assert room.game.is_first_lead is False
    assert room.game.current_seat == 1
    assert room.seats[0].hand == [parse_card("4S")]


def test_play_follow_rejects_when_not_beating_pile() -> None:
    pile_combo_cards = [parse_card("7S")]
    from app.rules_engine.combos import parse_combo

    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["4S"])],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=1,
        pile=parse_combo(pile_combo_cards),
        last_player_to_play=0,
    )
    with pytest.raises(GameError) as exc:
        play(room, 1, [parse_card("4S")])
    assert exc.value.code == "ILLEGAL_PLAY"


def test_play_follow_succeeds_when_beating_pile() -> None:
    from app.rules_engine.combos import parse_combo

    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["8S"])],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=1,
        pile=parse_combo([parse_card("7S")]),
        last_player_to_play=0,
    )
    play(room, 1, [parse_card("8S")])
    assert room.game.pile.high == parse_card("8S")
    assert room.game.last_player_to_play == 1


def test_play_emptying_hand_marks_seat_out() -> None:
    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["4S"])],
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    play(room, 0, [parse_card("3S")])
    assert room.seats[0].participation == ParticipationState.OUT
    assert room.game.placements == [0]


def test_is_game_over_true_with_one_seat_holding_cards() -> None:
    room = make_room([make_seat(0, []), make_seat(1, ["4S"])])
    assert is_game_over(room) is True


def test_is_game_over_false_with_two_seats_holding_cards() -> None:
    room = make_room([make_seat(0, ["3S"]), make_seat(1, ["4S"])])
    assert is_game_over(room) is False


def test_pass_rejects_during_lead() -> None:
    room = make_room([make_seat(0, ["3S"]), make_seat(1, ["4S"])], current_seat=0)
    with pytest.raises(GameError) as exc:
        pass_turn(room, 0)
    assert exc.value.code == "LEAD_MAY_NOT_PASS"


def test_pass_rejects_wrong_turn() -> None:
    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["4S"])],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=1,
    )
    with pytest.raises(GameError) as exc:
        pass_turn(room, 0)
    assert exc.value.code == "NOT_YOUR_TURN"


def test_pass_with_other_active_seats_advances_turn() -> None:
    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["4S"]), make_seat(2, ["5S"])],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=1,
        last_player_to_play=0,
    )
    pass_turn(room, 1)
    assert room.seats[1].participation == ParticipationState.PASSED
    assert room.game.current_seat == 2
    assert room.game.phase == GamePhase.AWAITING_FOLLOW


def test_pass_last_active_seat_resets_round_to_last_player() -> None:
    from app.rules_engine.combos import parse_combo

    room = make_room(
        [
            make_seat(0, ["3S"]),
            make_seat(1, ["4S"], participation=ParticipationState.PASSED),
            make_seat(2, ["5S"]),
        ],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=2,
        pile=parse_combo([parse_card("7S")]),
        last_player_to_play=0,
    )
    pass_turn(room, 2)

    assert room.game.phase == GamePhase.AWAITING_LEAD
    assert room.game.pile is None
    assert room.game.current_seat == 0
    assert room.seats[1].participation == ParticipationState.ACTIVE


def test_pass_last_active_seat_skips_leader_if_out() -> None:
    from app.rules_engine.combos import parse_combo

    room = make_room(
        [
            make_seat(0, [], participation=ParticipationState.OUT),
            make_seat(1, ["4S"], participation=ParticipationState.PASSED),
            make_seat(2, ["5S"]),
        ],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=2,
        pile=parse_combo([parse_card("7S")]),
        last_player_to_play=0,
    )
    pass_turn(room, 2)

    assert room.game.current_seat == 1


def test_advance_turn_skips_non_active_seats() -> None:
    room = make_room(
        [
            make_seat(0, ["3S"]),
            make_seat(1, ["4S"], participation=ParticipationState.PASSED),
            make_seat(2, ["5S"]),
        ],
        current_seat=0,
    )
    advance_turn(room)
    assert room.game.current_seat == 2


def test_turn_timer_expired_at_lead_autoplays_lowest_card_in_play_when_first_lead() -> None:
    room = make_room(
        [make_seat(0, ["5S", "3S"]), make_seat(1, ["4S"])],
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    turn_timer_expired(room)
    assert room.game.pile.high == parse_card("3S")
    assert parse_card("3S") not in room.seats[0].hand


def test_turn_timer_expired_at_lead_autoplays_seats_lowest_card() -> None:
    room = make_room(
        [make_seat(0, ["9S", "3S", "5S"]), make_seat(1, ["4S"])],
        current_seat=0,
        is_first_lead=False,
    )
    turn_timer_expired(room)
    assert room.game.pile.high == parse_card("3S")


def test_turn_timer_expired_at_follow_behaves_as_pass() -> None:
    from app.rules_engine.combos import parse_combo

    room = make_room(
        [make_seat(0, ["3S"]), make_seat(1, ["4S"]), make_seat(2, ["5S"])],
        phase=GamePhase.AWAITING_FOLLOW,
        current_seat=1,
        pile=parse_combo([parse_card("7S")]),
        last_player_to_play=0,
    )
    turn_timer_expired(room)
    assert room.seats[1].participation == ParticipationState.PASSED
    assert room.game.current_seat == 2

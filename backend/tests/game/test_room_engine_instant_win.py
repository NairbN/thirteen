from app.game.models import RoomState
from app.game.room_engine import create_room, join_room, resolve_instant_wins, set_ready
from app.rules_engine.cards import parse_card


def straight_hand() -> list[int]:
    return [
        parse_card(r + "S")
        for r in ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    ] + [parse_card("2H")]


def ordinary_hand() -> list[int]:
    return [
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
        parse_card("2C"),
    ]


def test_resolve_instant_wins_picks_the_only_qualifying_hand() -> None:
    from app.game.models import Seat

    seats = {
        0: Seat(seat_index=0, session_token="t0", username="a", icon="i", hand=straight_hand()),
        1: Seat(seat_index=1, session_token="t1", username="b", icon="i", hand=ordinary_hand()),
    }
    resolution = resolve_instant_wins(seats)
    assert resolution is not None
    assert resolution.winner_seat == 0
    assert resolution.category == "straight_3_to_a"


def test_resolve_instant_wins_none_when_no_hand_qualifies() -> None:
    from app.game.models import Seat

    seats = {
        0: Seat(seat_index=0, session_token="t0", username="a", icon="i", hand=ordinary_hand()),
    }
    assert resolve_instant_wins(seats) is None


def test_begin_first_game_finishes_immediately_on_instant_win(monkeypatch) -> None:
    room, host = create_room(username="alice", icon="cat")
    bob = join_room(room, username="bob", icon="dog")

    monkeypatch.setattr(
        "app.game.room_engine.deal", lambda seat_count, rng=None: [straight_hand(), ordinary_hand()]
    )

    set_ready(room, host.seat_index, True)
    set_ready(room, bob.seat_index, True)

    assert room.state == RoomState.FINISHED
    assert room.seats[host.seat_index].placement == 1
    assert room.seats[bob.seat_index].placement == 2
    assert room.seats[host.seat_index].score == 2  # 2-player 1st place value
    assert room.previous_winner == host.seat_index

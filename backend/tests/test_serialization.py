from app.game.models import Game, GamePhase, Room, RoomState, Seat
from app.game.room_engine import create_room
from app.rules_engine.cards import parse_card
from app.rules_engine.combos import parse_combo
from app.serialization import combo_to_dict, public_state


def test_combo_to_dict_none() -> None:
    assert combo_to_dict(None) is None


def test_combo_to_dict_shape() -> None:
    combo = parse_combo([parse_card("7S"), parse_card("7H")])
    assert combo_to_dict(combo) == {
        "type": "pair",
        "cards": [parse_card("7S"), parse_card("7H")],
        "length": 2,
        "high": parse_card("7H"),
        "isBomb": False,
    }


def test_public_state_never_includes_hands() -> None:
    room = Room(code="ABCDE", state=RoomState.IN_PROGRESS)
    seat = Seat(
        seat_index=0,
        session_token="secret-token",
        username="alice",
        icon="cat",
        hand=[parse_card("3S"), parse_card("4S")],
    )
    room.seats[0] = seat
    room.game = Game(phase=GamePhase.AWAITING_LEAD, current_seat=0)

    state = public_state(room)
    seat_json = state["seats"][0]

    assert seat_json["handCount"] == 2
    assert "hand" not in seat_json
    assert "sessionToken" not in seat_json
    assert state["code"] == "ABCDE"
    assert state["state"] == "in_progress"
    assert state["game"]["phase"] == "awaiting_lead"
    assert state["game"]["currentSeat"] == 0


def test_public_state_game_none_when_not_started() -> None:
    room, _ = create_room(username="a", icon="1")
    state = public_state(room)
    assert state["game"] is None

from typing import Any

from app.game.models import Room, Seat
from app.rules_engine import Combo


def combo_to_dict(combo: Combo | None) -> dict[str, Any] | None:
    if combo is None:
        return None
    return {
        "type": combo.type.value,
        "cards": list(combo.cards),
        "length": combo.length,
        "high": combo.high,
        "isBomb": combo.is_bomb,
    }


def public_seat(seat: Seat) -> dict[str, Any]:
    return {
        "seatIndex": seat.seat_index,
        "username": seat.username,
        "icon": seat.icon,
        "isHost": seat.is_host,
        "connection": seat.connection.value,
        "isReady": seat.is_ready,
        "participation": seat.participation.value,
        "handCount": len(seat.hand),
        "rematchVote": seat.rematch_vote.value,
        "score": seat.score,
        "placement": seat.placement,
    }


def public_state(room: Room) -> dict[str, Any]:
    game: dict[str, Any] | None = None
    if room.game is not None:
        game = {
            "phase": room.game.phase.value,
            "currentSeat": room.game.current_seat,
            "pile": combo_to_dict(room.game.pile),
            "lastPlayerToPlay": room.game.last_player_to_play,
            "turnDeadline": room.game.turn_deadline,
        }

    return {
        "code": room.code,
        "state": room.state.value,
        "seats": [public_seat(seat) for seat in room.ordered_seats()],
        "gameNumber": room.game_number,
        "game": game,
    }

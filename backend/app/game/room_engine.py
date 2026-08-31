import random
import time
from dataclasses import dataclass

from app.game.deck import (
    INSTANT_WIN_STRENGTH,
    InstantWinCategory,
    deal,
    find_instant_win,
    lowest_card_in_play,
)
from app.game.game_engine import advance_turn, is_game_over
from app.game.game_engine import pass_turn as _game_pass
from app.game.game_engine import play as _game_play
from app.game.game_engine import turn_timer_expired as _game_turn_timer_expired
from app.game.ids import generate_room_code, generate_session_token
from app.game.models import (
    MAX_SEATS,
    MIN_SEATS_TO_START,
    TURN_TIMER_SECONDS,
    ConnectionState,
    Game,
    GameError,
    GamePhase,
    ParticipationState,
    RematchVote,
    Room,
    RoomState,
    Seat,
)
from app.game.scoring import points_for_placement
from app.rules_engine import Card


@dataclass(frozen=True)
class InstantWinResolution:
    winner_seat: int
    category: InstantWinCategory


def _touch(room: Room) -> None:
    room.last_activity_at = time.time()


def _next_free_seat_index(room: Room) -> int:
    for i in range(MAX_SEATS):
        if i not in room.seats:
            return i
    raise GameError("ROOM_FULL")


def _remove_seat(room: Room, seat_index: int) -> None:
    was_host = room.seats[seat_index].is_host
    del room.seats[seat_index]
    if was_host and room.seats:
        room.seats[min(room.seats)].is_host = True


def create_room(*, username: str, icon: str) -> tuple[Room, Seat]:
    room = Room(code=generate_room_code())
    seat = Seat(
        seat_index=0,
        session_token=generate_session_token(),
        username=username,
        icon=icon,
        is_host=True,
    )
    room.seats[0] = seat
    return room, seat


def join_room(room: Room, *, username: str, icon: str) -> Seat:
    if room.state != RoomState.WAITING:
        raise GameError("ROOM_LOCKED")
    if len(room.seats) >= MAX_SEATS:
        raise GameError("ROOM_FULL")
    idx = _next_free_seat_index(room)
    seat = Seat(
        seat_index=idx, session_token=generate_session_token(), username=username, icon=icon
    )
    room.seats[idx] = seat
    _touch(room)
    return seat


def find_seat_by_token(room: Room, session_token: str) -> Seat | None:
    for seat in room.seats.values():
        if seat.session_token == session_token:
            return seat
    return None


def leave_room(room: Room, seat_index: int) -> None:
    if room.state == RoomState.WAITING:
        _remove_seat(room, seat_index)
        if not room.seats:
            room.state = RoomState.ABANDONED
        return
    if room.state == RoomState.STARTING:
        _remove_seat(room, seat_index)
        room.state = RoomState.WAITING
        room.game = None
        for seat in room.seats.values():
            seat.is_ready = False
        return
    if room.state == RoomState.FINISHED:
        _remove_seat(room, seat_index)
        if not room.seats:
            room.state = RoomState.ABANDONED
        return
    raise GameError("WRONG_STATE")


def set_ready(
    room: Room, seat_index: int, ready: bool, *, rng: random.Random | None = None
) -> None:
    if room.state != RoomState.WAITING:
        raise GameError("WRONG_STATE")
    room.seats[seat_index].is_ready = ready
    _touch(room)
    if (
        ready
        and MIN_SEATS_TO_START <= len(room.seats) <= MAX_SEATS
        and all(s.is_ready for s in room.seats.values())
    ):
        _begin_first_game(room, rng=rng)


def resolve_instant_wins(seats: dict[int, Seat]) -> InstantWinResolution | None:
    best_key: tuple[int, int] | None = None
    best_seat: int | None = None
    best_category: InstantWinCategory | None = None
    for idx in sorted(seats):
        win = find_instant_win(seats[idx].hand)
        if win is None:
            continue
        key = (INSTANT_WIN_STRENGTH[win.category], win.high_card)
        if best_key is None or key > best_key:
            best_key = key
            best_seat = idx
            best_category = win.category
    if best_seat is None or best_category is None:
        return None
    return InstantWinResolution(winner_seat=best_seat, category=best_category)


def _enter_starting(room: Room, rng: random.Random | None = None) -> str:
    for seat in room.seats.values():
        seat.is_ready = False
        seat.placement = None
        seat.participation = ParticipationState.ACTIVE
        seat.rematch_vote = RematchVote.NONE

    hands = deal(len(room.seats), rng=rng)
    seat_indexes = sorted(room.seats)
    for idx, hand in zip(seat_indexes, hands, strict=True):
        room.seats[idx].hand = hand

    lowest = lowest_card_in_play(hands)
    is_first_game = room.game_number == 1
    if is_first_game:
        lead_seat = next(i for i in seat_indexes if lowest in room.seats[i].hand)
    elif room.previous_winner is not None and room.previous_winner in room.seats:
        lead_seat = room.previous_winner
    else:
        lead_seat = seat_indexes[0]

    room.game = Game(
        phase=GamePhase.AWAITING_LEAD,
        current_seat=lead_seat,
        is_first_lead=is_first_game,
        lowest_card_in_play=lowest,
    )

    if resolve_instant_wins(room.seats) is not None:
        return "INSTANT_WIN"
    return "DEAL_COMPLETE"


def _begin_first_game(room: Room, *, rng: random.Random | None = None) -> None:
    room.state = RoomState.STARTING
    event = _enter_starting(room, rng=rng)
    _resolve_starting_event(room, event)


def _begin_rematch(room: Room, *, rng: random.Random | None = None) -> None:
    room.game_number += 1
    room.state = RoomState.STARTING
    event = _enter_starting(room, rng=rng)
    _resolve_starting_event(room, event)


def _resolve_starting_event(room: Room, event: str) -> None:
    if event == "INSTANT_WIN":
        resolution = resolve_instant_wins(room.seats)
        assert resolution is not None
        _finish_instant_win(room, resolution.winner_seat)
    else:
        room.state = RoomState.IN_PROGRESS
        assert room.game is not None
        room.game.turn_deadline = time.time() + TURN_TIMER_SECONDS


def _finish_instant_win(room: Room, winner_seat: int) -> None:
    n = len(room.seats)
    room.previous_winner = winner_seat
    for idx, seat in room.seats.items():
        placement = 1 if idx == winner_seat else n
        seat.placement = placement
        seat.score += points_for_placement(n, placement)
        seat.is_ready = False
        seat.rematch_vote = RematchVote.NONE
    room.state = RoomState.FINISHED
    room.last_finish_reason = "instant_win"


def _finish_normal(room: Room, *, reason: str = "normal") -> None:
    game = room.game
    assert game is not None
    n = len(room.seats)

    ranking = list(game.placements)
    remaining = [i for i in sorted(room.seats) if i not in ranking and i not in game.forfeit_order]
    ranking.extend(remaining)
    # Later forfeits outrank earlier ones: whoever forfeits first was "still holding
    # cards" (per the resolved decision) at every later forfeit, so must rank below it.
    ranking.extend(reversed(game.forfeit_order))

    for position, seat_index in enumerate(ranking, start=1):
        seat = room.seats[seat_index]
        seat.placement = position
        seat.score += points_for_placement(n, position)

    if ranking:
        room.previous_winner = ranking[0]
    for seat in room.seats.values():
        seat.is_ready = False
        seat.rematch_vote = RematchVote.NONE
    room.state = RoomState.FINISHED
    room.last_finish_reason = reason


def _require_in_progress(room: Room) -> None:
    if room.state != RoomState.IN_PROGRESS:
        raise GameError("WRONG_STATE")


def handle_play(room: Room, seat_index: int, cards: list[Card]) -> None:
    _require_in_progress(room)
    _game_play(room, seat_index, cards)
    _touch(room)
    if is_game_over(room):
        _finish_normal(room)


def handle_pass(room: Room, seat_index: int) -> None:
    _require_in_progress(room)
    _game_pass(room, seat_index)
    _touch(room)
    if is_game_over(room):
        _finish_normal(room)


def handle_turn_timer_expired(room: Room) -> None:
    _require_in_progress(room)
    _game_turn_timer_expired(room)
    if is_game_over(room):
        _finish_normal(room)


def forfeit_seat(room: Room, seat_index: int) -> None:
    _require_in_progress(room)
    game = room.game
    assert game is not None
    seat = room.seats[seat_index]

    seat.hand = []
    seat.participation = ParticipationState.FORFEITED
    game.forfeit_order.append(seat_index)

    if sum(1 for s in room.seats.values() if s.hand) < 2:
        _finish_normal(room, reason="players_left")
        return

    if game.current_seat == seat_index:
        advance_turn(room)
        game.turn_deadline = time.time() + TURN_TIMER_SECONDS


def disconnect_seat(room: Room, seat_index: int) -> None:
    if room.state != RoomState.IN_PROGRESS:
        leave_room(room, seat_index)
        return
    room.seats[seat_index].connection = ConnectionState.DISCONNECTED


def reconnect_seat(room: Room, session_token: str) -> Seat:
    seat = find_seat_by_token(room, session_token)
    if seat is None:
        raise GameError("INVALID_SESSION")
    seat.connection = ConnectionState.CONNECTED
    return seat


def accept_rematch(room: Room, seat_index: int, *, rng: random.Random | None = None) -> None:
    if room.state != RoomState.FINISHED:
        raise GameError("WRONG_STATE")
    room.seats[seat_index].rematch_vote = RematchVote.ACCEPT
    _maybe_start_rematch(room, rng=rng)


def decline_rematch(room: Room, seat_index: int) -> None:
    if room.state != RoomState.FINISHED:
        raise GameError("WRONG_STATE")
    room.seats[seat_index].rematch_vote = RematchVote.DECLINE


def _maybe_start_rematch(room: Room, *, rng: random.Random | None = None) -> None:
    connected = [s for s in room.seats.values() if s.connection == ConnectionState.CONNECTED]
    if len(connected) < MIN_SEATS_TO_START:
        return
    if all(s.rematch_vote == RematchVote.ACCEPT for s in connected):
        _begin_rematch(room, rng=rng)


def rematch_timeout(room: Room, *, rng: random.Random | None = None) -> None:
    if room.state != RoomState.FINISHED:
        raise GameError("WRONG_STATE")
    accepted = [i for i, s in room.seats.items() if s.rematch_vote == RematchVote.ACCEPT]
    if len(accepted) < MIN_SEATS_TO_START:
        return
    for idx in list(room.seats):
        if idx not in accepted:
            del room.seats[idx]
    if room.seats and not any(s.is_host for s in room.seats.values()):
        room.seats[min(room.seats)].is_host = True
    _begin_rematch(room, rng=rng)


def room_ttl_expired(room: Room) -> None:
    room.state = RoomState.ABANDONED


def all_disconnected_grace_expired(room: Room) -> None:
    if room.state == RoomState.IN_PROGRESS and all(
        s.connection == ConnectionState.DISCONNECTED for s in room.seats.values()
    ):
        room.state = RoomState.ABANDONED

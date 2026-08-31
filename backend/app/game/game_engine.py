import time

from app.game.models import TURN_TIMER_SECONDS, GameError, GamePhase, ParticipationState, Room
from app.rules_engine import Card, beats, parse_combo


def is_game_over(room: Room) -> bool:
    return sum(1 for seat in room.seats.values() if seat.hand) <= 1


def advance_turn(room: Room) -> None:
    game = room.game
    assert game is not None
    seat_indexes = sorted(room.seats)
    if not seat_indexes:
        return
    start = seat_indexes.index(game.current_seat) if game.current_seat in seat_indexes else 0
    for step in range(1, len(seat_indexes) + 1):
        idx = seat_indexes[(start + step) % len(seat_indexes)]
        if room.seats[idx].participation == ParticipationState.ACTIVE:
            game.current_seat = idx
            return


def _next_holder_clockwise(room: Room, from_seat: int) -> int | None:
    seat_indexes = sorted(room.seats)
    if from_seat not in seat_indexes:
        seat_indexes_with_from = sorted([*seat_indexes, from_seat])
        start_pos = seat_indexes_with_from.index(from_seat)
    else:
        start_pos = seat_indexes.index(from_seat)
    for step in range(1, len(seat_indexes) + 1):
        idx = seat_indexes[(start_pos + step) % len(seat_indexes)]
        if room.seats[idx].hand:
            return idx
    return None


def _out_check(room: Room, seat_index: int) -> None:
    game = room.game
    assert game is not None
    seat = room.seats[seat_index]
    if not seat.hand:
        seat.participation = ParticipationState.OUT
        game.placements.append(seat_index)


def _reset_round(room: Room) -> None:
    game = room.game
    assert game is not None
    game.pile = None
    for seat in room.seats.values():
        if seat.participation == ParticipationState.PASSED:
            seat.participation = ParticipationState.ACTIVE

    lead = game.last_player_to_play
    if lead is not None and room.seats.get(lead) is not None and room.seats[lead].hand:
        game.current_seat = lead
    else:
        next_holder = _next_holder_clockwise(room, lead if lead is not None else game.current_seat)
        if next_holder is not None:
            game.current_seat = next_holder

    game.phase = GamePhase.AWAITING_LEAD


def play(room: Room, seat_index: int, cards: list[Card], *, now: float | None = None) -> None:
    now = now if now is not None else time.time()
    game = room.game
    if game is None:
        raise GameError("WRONG_STATE")
    seat = room.seats.get(seat_index)
    if seat is None:
        raise GameError("WRONG_STATE")
    if seat_index != game.current_seat:
        raise GameError("NOT_YOUR_TURN")
    if not cards or any(c not in seat.hand for c in cards):
        raise GameError("CARDS_NOT_HELD")

    combo = parse_combo(cards)
    if combo is None:
        raise GameError("ILLEGAL_PLAY")

    if game.phase == GamePhase.AWAITING_LEAD:
        if game.is_first_lead and game.lowest_card_in_play not in combo.cards:
            raise GameError("MUST_INCLUDE_LOWEST_CARD")
    else:
        if game.pile is None or not beats(combo, game.pile):
            raise GameError("ILLEGAL_PLAY")

    for c in combo.cards:
        seat.hand.remove(c)
    game.pile = combo
    game.last_player_to_play = seat_index
    game.is_first_lead = False
    game.phase = GamePhase.AWAITING_FOLLOW

    _out_check(room, seat_index)
    advance_turn(room)
    game.turn_deadline = now + TURN_TIMER_SECONDS


def pass_turn(room: Room, seat_index: int, *, now: float | None = None) -> None:
    now = now if now is not None else time.time()
    game = room.game
    if game is None:
        raise GameError("WRONG_STATE")
    if seat_index != game.current_seat:
        raise GameError("NOT_YOUR_TURN")
    if game.phase == GamePhase.AWAITING_LEAD:
        raise GameError("LEAD_MAY_NOT_PASS")

    seat = room.seats[seat_index]
    # The lead's own seat is never a "contender" still needing to act -- it already
    # set the pile. Excluding it is what lets the round end and return to them.
    other_active = [
        i
        for i, s in room.seats.items()
        if i != seat_index
        and i != game.last_player_to_play
        and s.participation == ParticipationState.ACTIVE
    ]

    if other_active:
        seat.participation = ParticipationState.PASSED
        advance_turn(room)
    else:
        _reset_round(room)

    game.turn_deadline = now + TURN_TIMER_SECONDS


def turn_timer_expired(room: Room, *, now: float | None = None) -> None:
    game = room.game
    if game is None:
        raise GameError("WRONG_STATE")
    seat_index = game.current_seat
    seat = room.seats[seat_index]

    if game.phase == GamePhase.AWAITING_LEAD:
        card = game.lowest_card_in_play if game.is_first_lead else min(seat.hand)
        play(room, seat_index, [card], now=now)
    else:
        pass_turn(room, seat_index, now=now)

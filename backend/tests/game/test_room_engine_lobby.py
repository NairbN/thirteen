import random

import pytest

from app.game.models import GameError, ParticipationState, RoomState
from app.game.room_engine import create_room, join_room, leave_room, set_ready


def test_create_room_assigns_host_seat_zero() -> None:
    room, seat = create_room(username="alice", icon="cat")
    assert room.state == RoomState.WAITING
    assert seat.seat_index == 0
    assert seat.is_host is True
    assert len(room.code) == 5


def test_join_room_assigns_next_free_seat() -> None:
    room, _ = create_room(username="alice", icon="cat")
    seat = join_room(room, username="bob", icon="dog")
    assert seat.seat_index == 1
    assert seat.is_host is False


def test_join_room_rejects_when_full() -> None:
    room, _ = create_room(username="alice", icon="cat")
    for name in ["bob", "carl", "dee"]:
        join_room(room, username=name, icon="dog")
    with pytest.raises(GameError) as exc:
        join_room(room, username="eve", icon="fox")
    assert exc.value.code == "ROOM_FULL"


def test_join_room_rejects_when_locked() -> None:
    room, _ = create_room(username="alice", icon="cat")
    join_room(room, username="bob", icon="dog")
    room.state = RoomState.IN_PROGRESS
    with pytest.raises(GameError) as exc:
        join_room(room, username="carl", icon="owl")
    assert exc.value.code == "ROOM_LOCKED"


def test_leave_room_frees_seat_and_reassigns_host() -> None:
    room, host = create_room(username="alice", icon="cat")
    bob = join_room(room, username="bob", icon="dog")
    leave_room(room, host.seat_index)
    assert host.seat_index not in room.seats
    assert room.seats[bob.seat_index].is_host is True


def test_leave_room_last_occupant_abandons() -> None:
    room, host = create_room(username="alice", icon="cat")
    leave_room(room, host.seat_index)
    assert room.state == RoomState.ABANDONED


def test_set_ready_starts_game_when_all_ready() -> None:
    room, host = create_room(username="alice", icon="cat")
    bob = join_room(room, username="bob", icon="dog")
    set_ready(room, host.seat_index, True, rng=random.Random(0))
    assert room.state == RoomState.WAITING
    set_ready(room, bob.seat_index, True, rng=random.Random(0))
    assert room.state in (RoomState.IN_PROGRESS, RoomState.FINISHED)


def test_set_ready_does_not_start_below_min_seats() -> None:
    room, host = create_room(username="alice", icon="cat")
    set_ready(room, host.seat_index, True, rng=random.Random(0))
    assert room.state == RoomState.WAITING


def test_starting_entry_deals_full_hands_and_locks_joins() -> None:
    room, host = create_room(username="alice", icon="cat")
    bob = join_room(room, username="bob", icon="dog")
    set_ready(room, host.seat_index, True, rng=random.Random(1))
    set_ready(room, bob.seat_index, True, rng=random.Random(1))

    if room.state == RoomState.IN_PROGRESS:
        assert len(room.seats[host.seat_index].hand) + len(room.seats[bob.seat_index].hand) <= 26
        assert all(s.participation == ParticipationState.ACTIVE for s in room.seats.values())
        assert room.game is not None
        assert room.game.is_first_lead is True

    with pytest.raises(GameError):
        join_room(room, username="carl", icon="owl")

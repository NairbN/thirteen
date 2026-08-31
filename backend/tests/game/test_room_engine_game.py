import random

import pytest

from app.game.models import (
    ConnectionState,
    Game,
    GameError,
    GamePhase,
    ParticipationState,
    RematchVote,
    Room,
    RoomState,
)
from app.game.room_engine import (
    accept_rematch,
    all_disconnected_grace_expired,
    create_room,
    decline_rematch,
    disconnect_seat,
    find_seat_by_token,
    forfeit_seat,
    handle_pass,
    handle_play,
    join_room,
    reconnect_seat,
    rematch_timeout,
    room_ttl_expired,
    set_ready,
)
from app.rules_engine.cards import parse_card


def start_two_player_game(rng_seed: int = 0) -> Room:
    room, host = create_room(username="alice", icon="cat")
    join_room(room, username="bob", icon="dog")
    set_ready(room, 0, True, rng=random.Random(rng_seed))
    set_ready(room, 1, True, rng=random.Random(rng_seed))
    return room


def test_forfeit_with_three_players_ranking() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    join_room(room, username="c", icon="3")
    room.state = RoomState.IN_PROGRESS
    room.game = Game(phase=GamePhase.AWAITING_LEAD, current_seat=0)
    for i in range(3):
        room.seats[i].hand = [parse_card("3S")] if i != 2 else [parse_card("4S"), parse_card("5S")]

    forfeit_seat(room, 0)
    assert room.seats[0].participation == ParticipationState.FORFEITED
    assert room.state == RoomState.IN_PROGRESS

    forfeit_seat(room, 1)
    assert room.state == RoomState.FINISHED
    assert room.seats[2].placement == 1
    assert room.seats[1].placement == 2
    assert room.seats[0].placement == 3


def test_forfeit_reassigns_current_turn() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    join_room(room, username="c", icon="3")
    room.state = RoomState.IN_PROGRESS
    room.game = Game(phase=GamePhase.AWAITING_LEAD, current_seat=0)
    for i in range(3):
        room.seats[i].hand = [parse_card("3S"), parse_card("4S")]

    forfeit_seat(room, 0)
    assert room.game.current_seat == 1


def test_handle_play_transitions_to_finished_when_one_seat_remains() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    room.state = RoomState.IN_PROGRESS
    room.game = Game(
        phase=GamePhase.AWAITING_LEAD,
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    room.seats[0].hand = [parse_card("3S")]
    room.seats[1].hand = [parse_card("4S")]

    handle_play(room, 0, [parse_card("3S")])
    assert room.state == RoomState.FINISHED
    assert room.seats[0].placement == 1
    assert room.seats[1].placement == 2
    assert room.previous_winner == 0


def test_finish_reason_normal_on_natural_end() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    room.state = RoomState.IN_PROGRESS
    room.game = Game(
        phase=GamePhase.AWAITING_LEAD,
        current_seat=0,
        is_first_lead=True,
        lowest_card_in_play=parse_card("3S"),
    )
    room.seats[0].hand = [parse_card("3S")]
    room.seats[1].hand = [parse_card("4S")]
    handle_play(room, 0, [parse_card("3S")])
    assert room.last_finish_reason == "normal"


def test_finish_reason_players_left_on_forfeit_end() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    room.state = RoomState.IN_PROGRESS
    room.game = Game(phase=GamePhase.AWAITING_LEAD, current_seat=0)
    room.seats[0].hand = [parse_card("3S")]
    room.seats[1].hand = [parse_card("4S")]
    forfeit_seat(room, 0)
    assert room.last_finish_reason == "players_left"


def test_handle_pass_rejects_wrong_state() -> None:
    room, host = create_room(username="a", icon="1")
    with pytest.raises(GameError) as exc:
        handle_pass(room, 0)
    assert exc.value.code == "WRONG_STATE"


def test_disconnect_during_in_progress_keeps_seat_in_game() -> None:
    room = start_two_player_game()
    if room.state != RoomState.IN_PROGRESS:
        return
    disconnect_seat(room, 0)
    assert room.seats[0].connection == ConnectionState.DISCONNECTED
    assert 0 in room.seats
    assert room.state == RoomState.IN_PROGRESS


def test_disconnect_during_waiting_frees_seat() -> None:
    room, host = create_room(username="a", icon="1")
    join_room(room, username="b", icon="2")
    disconnect_seat(room, 0)
    assert 0 not in room.seats


def test_reconnect_by_session_token() -> None:
    room, host = create_room(username="a", icon="1")
    seat = join_room(room, username="b", icon="2")
    room.state = RoomState.IN_PROGRESS
    disconnect_seat(room, seat.seat_index)

    reconnected = reconnect_seat(room, seat.session_token)
    assert reconnected.seat_index == seat.seat_index
    assert reconnected.connection == ConnectionState.CONNECTED


def test_reconnect_invalid_token_raises() -> None:
    room, _ = create_room(username="a", icon="1")
    with pytest.raises(GameError) as exc:
        reconnect_seat(room, "bogus-token")
    assert exc.value.code == "INVALID_SESSION"


def test_find_seat_by_token() -> None:
    room, host = create_room(username="a", icon="1")
    assert find_seat_by_token(room, host.session_token) is host
    assert find_seat_by_token(room, "nope") is None


def test_rematch_all_accept_starts_new_game() -> None:
    room, host = create_room(username="a", icon="1")
    bob = join_room(room, username="b", icon="2")
    room.state = RoomState.FINISHED
    room.game_number = 1
    room.seats[host.seat_index].score = 4
    room.seats[bob.seat_index].score = 1

    accept_rematch(room, host.seat_index, rng=random.Random(2))
    assert room.state == RoomState.FINISHED
    accept_rematch(room, bob.seat_index, rng=random.Random(2))
    assert room.state in (RoomState.IN_PROGRESS, RoomState.FINISHED)
    assert room.game_number == 2
    assert room.seats[host.seat_index].score == 4
    assert room.seats[bob.seat_index].score == 1


def test_rematch_timeout_drops_non_accepting_seats() -> None:
    room, host = create_room(username="a", icon="1")
    bob = join_room(room, username="b", icon="2")
    carl = join_room(room, username="c", icon="3")
    room.state = RoomState.FINISHED
    room.seats[host.seat_index].rematch_vote = RematchVote.ACCEPT
    room.seats[bob.seat_index].rematch_vote = RematchVote.ACCEPT
    room.seats[carl.seat_index].rematch_vote = RematchVote.NONE

    rematch_timeout(room, rng=random.Random(3))
    assert carl.seat_index not in room.seats
    assert room.state in (RoomState.IN_PROGRESS, RoomState.FINISHED)


def test_rematch_timeout_below_min_leaves_room_finished() -> None:
    room, host = create_room(username="a", icon="1")
    bob = join_room(room, username="b", icon="2")
    room.state = RoomState.FINISHED
    room.seats[host.seat_index].rematch_vote = RematchVote.ACCEPT
    room.seats[bob.seat_index].rematch_vote = RematchVote.DECLINE

    rematch_timeout(room, rng=random.Random(4))
    assert room.state == RoomState.FINISHED
    assert bob.seat_index in room.seats


def test_decline_rematch_records_vote() -> None:
    room, host = create_room(username="a", icon="1")
    room.state = RoomState.FINISHED
    decline_rematch(room, host.seat_index)
    assert room.seats[host.seat_index].rematch_vote == RematchVote.DECLINE


def test_room_ttl_expired_abandons() -> None:
    room, _ = create_room(username="a", icon="1")
    room_ttl_expired(room)
    assert room.state == RoomState.ABANDONED


def test_all_disconnected_grace_abandons_only_when_all_disconnected() -> None:
    room = start_two_player_game()
    if room.state != RoomState.IN_PROGRESS:
        return
    disconnect_seat(room, 0)
    all_disconnected_grace_expired(room)
    assert room.state == RoomState.IN_PROGRESS

    disconnect_seat(room, 1)
    all_disconnected_grace_expired(room)
    assert room.state == RoomState.ABANDONED

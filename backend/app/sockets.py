import time
from typing import Any

import socketio

from app import timers
from app.config import settings
from app.game import room_engine
from app.game.models import (
    ALL_DISCONNECTED_GRACE_SECONDS,
    REMATCH_TIMEOUT_SECONDS,
    ROOM_TTL_FINISHED_SECONDS,
    ROOM_TTL_WAITING_SECONDS,
    ConnectionState,
    GameError,
    Room,
    RoomState,
)
from app.game.scoring import points_for_placement
from app.rooms import RoomRegistry
from app.serialization import combo_to_dict, public_state

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.frontend_origin],
)

registry = RoomRegistry()
# sid -> (room code, seat index). The server is the sole source of truth for which
# seat a socket controls -- client-supplied seat indexes are never trusted.
sid_seat: dict[str, tuple[str, int]] = {}


def _sids_for_room(code: str) -> list[str]:
    return [sid for sid, (c, _) in sid_seat.items() if c == code]


def _require_room(sid: str) -> tuple[Room | None, int]:
    entry = sid_seat.get(sid)
    if entry is None:
        return None, -1
    code, seat_index = entry
    return registry.get(code), seat_index


async def _broadcast_state(room: Room) -> None:
    await sio.emit("state:sync", public_state(room), room=room.code)


async def _broadcast_hands(room: Room) -> None:
    for sid in _sids_for_room(room.code):
        _, seat_index = sid_seat[sid]
        seat = room.seats.get(seat_index)
        if seat is not None:
            await sio.emit("hand:sync", {"cards": seat.hand}, to=sid)


async def _emit_game_over(room: Room) -> None:
    n = len(room.seats)
    ranked = sorted(room.seats.values(), key=lambda s: s.placement or n + 1)
    await sio.emit(
        "game:over",
        {
            "placements": [seat.seat_index for seat in ranked],
            "points": {
                str(seat.seat_index): points_for_placement(n, seat.placement or n)
                for seat in room.seats.values()
            },
            "scoreboard": {str(seat.seat_index): seat.score for seat in room.seats.values()},
            "reason": room.last_finish_reason,
        },
        room=room.code,
    )


async def _close_room(room: Room, reason: str = "abandoned") -> None:
    code = room.code
    await sio.emit("room:closed", {"reason": reason}, room=code)
    timers.cancel_all(code)
    registry.remove(code)
    for sid in _sids_for_room(code):
        sid_seat.pop(sid, None)


async def _sync_timers(room: Room) -> None:
    code = room.code
    if room.state == RoomState.WAITING:
        timers.cancel(code, "turn")
        timers.cancel(code, "rematch")
        timers.cancel(code, "grace")
        timers.schedule(code, "ttl", ROOM_TTL_WAITING_SECONDS, lambda: _on_room_ttl_expired(code))
    elif room.state == RoomState.IN_PROGRESS:
        timers.cancel(code, "ttl")
        timers.cancel(code, "rematch")
        assert room.game is not None
        delay = max(0.0, room.game.turn_deadline - time.time())
        timers.schedule(code, "turn", delay, lambda: _on_turn_timer_expired(code))
        all_disconnected = room.seats and all(
            s.connection == ConnectionState.DISCONNECTED for s in room.seats.values()
        )
        if all_disconnected:
            timers.schedule(
                code, "grace", ALL_DISCONNECTED_GRACE_SECONDS, lambda: _on_grace_expired(code)
            )
        else:
            timers.cancel(code, "grace")
    elif room.state == RoomState.FINISHED:
        timers.cancel(code, "turn")
        timers.cancel(code, "grace")
        timers.schedule(code, "rematch", REMATCH_TIMEOUT_SECONDS, lambda: _on_rematch_timeout(code))
        timers.schedule(code, "ttl", ROOM_TTL_FINISHED_SECONDS, lambda: _on_room_ttl_expired(code))
    else:
        timers.cancel_all(code)


async def _after_mutation(room: Room) -> None:
    if room.state == RoomState.ABANDONED:
        await _close_room(room)
        return
    await _broadcast_hands(room)
    await _broadcast_state(room)
    await _sync_timers(room)


async def _on_turn_timer_expired(code: str) -> None:
    room = registry.get(code)
    if room is None or room.state != RoomState.IN_PROGRESS:
        return
    try:
        room_engine.handle_turn_timer_expired(room)
    except GameError:
        return
    if room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)


async def _on_room_ttl_expired(code: str) -> None:
    room = registry.get(code)
    if room is None:
        return
    room_engine.room_ttl_expired(room)
    await _close_room(room)


async def _on_grace_expired(code: str) -> None:
    room = registry.get(code)
    if room is None:
        return
    room_engine.all_disconnected_grace_expired(room)
    if room.state == RoomState.ABANDONED:
        await _close_room(room)


async def _on_rematch_timeout(code: str) -> None:
    room = registry.get(code)
    if room is None or room.state != RoomState.FINISHED:
        return
    game_number_before = room.game_number
    room_engine.rematch_timeout(room)
    if room.game_number != game_number_before and room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)


async def _join_socket_room(sid: str, room: Room, seat_index: int) -> None:
    await sio.enter_room(sid, room.code)
    sid_seat[sid] = (room.code, seat_index)


@sio.event
async def connect(sid: str, environ: dict) -> None:
    pass


@sio.event
async def disconnect(sid: str) -> None:
    entry = sid_seat.pop(sid, None)
    if entry is None:
        return
    code, seat_index = entry
    room = registry.get(code)
    if room is None:
        return
    room_engine.disconnect_seat(room, seat_index)
    await _after_mutation(room)


@sio.on("room:create")
async def on_room_create(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room, seat = room_engine.create_room(
        username=data.get("username", ""), icon=data.get("icon", "")
    )
    registry.add(room)
    await _join_socket_room(sid, room, seat.seat_index)
    await _after_mutation(room)
    return {
        "ok": True,
        "code": room.code,
        "sessionToken": seat.session_token,
        "seatIndex": seat.seat_index,
    }


@sio.on("room:join")
async def on_room_join(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room = registry.get(data.get("code", ""))
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    try:
        seat = room_engine.join_room(
            room, username=data.get("username", ""), icon=data.get("icon", "")
        )
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    await _join_socket_room(sid, room, seat.seat_index)
    await _after_mutation(room)
    return {"ok": True, "sessionToken": seat.session_token, "seatIndex": seat.seat_index}


@sio.on("room:rejoin")
async def on_room_rejoin(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room = registry.get(data.get("code", ""))
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    try:
        seat = room_engine.reconnect_seat(room, data.get("sessionToken", ""))
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    await _join_socket_room(sid, room, seat.seat_index)
    await _after_mutation(room)
    return {"ok": True, "seatIndex": seat.seat_index}


@sio.on("room:leave")
async def on_room_leave(sid: str, _data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    try:
        if room.state == RoomState.IN_PROGRESS:
            room_engine.forfeit_seat(room, seat_index)
        else:
            room_engine.leave_room(room, seat_index)
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    sid_seat.pop(sid, None)
    await sio.leave_room(sid, room.code)
    if room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)
    return {"ok": True}


@sio.on("player:update")
async def on_player_update(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    if room.state not in (RoomState.WAITING, RoomState.FINISHED):
        return {"ok": False, "code": "WRONG_STATE"}
    seat = room.seats[seat_index]
    if data.get("username"):
        seat.username = data["username"]
    if data.get("icon"):
        seat.icon = data["icon"]
    await _after_mutation(room)
    return {"ok": True}


@sio.on("player:ready")
async def on_player_ready(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    try:
        room_engine.set_ready(room, seat_index, bool(data.get("ready", False)))
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    if room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)
    return {"ok": True}


@sio.on("game:play")
async def on_game_play(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    cards = [int(c) for c in data.get("cards", [])]
    try:
        room_engine.handle_play(room, seat_index, cards)
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    assert room.game is not None
    await sio.emit(
        "game:played",
        {"seatIndex": seat_index, "combo": combo_to_dict(room.game.pile)},
        room=room.code,
    )
    if room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)
    return {"ok": True}


@sio.on("game:pass")
async def on_game_pass(sid: str, _data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    try:
        room_engine.handle_pass(room, seat_index)
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    await sio.emit("game:passed", {"seatIndex": seat_index}, room=room.code)
    assert room.game is not None
    if room.game.phase.value == "awaiting_lead" and room.game.pile is None:
        await sio.emit("round:reset", {"leadSeat": room.game.current_seat}, room=room.code)
    if room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)
    return {"ok": True}


@sio.on("game:rematch")
async def on_game_rematch(sid: str, data: dict[str, Any]) -> dict[str, Any]:
    room, seat_index = _require_room(sid)
    if room is None:
        return {"ok": False, "code": "ROOM_NOT_FOUND"}
    game_number_before = room.game_number
    try:
        if data.get("accept", False):
            room_engine.accept_rematch(room, seat_index)
        else:
            room_engine.decline_rematch(room, seat_index)
    except GameError as e:
        return {"ok": False, "code": e.code, "message": e.message}
    if room.game_number != game_number_before and room.state == RoomState.FINISHED:
        await _emit_game_over(room)
    await _after_mutation(room)
    return {"ok": True}

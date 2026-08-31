from app.game.room_engine import create_room
from app.rooms import RoomRegistry


def test_registry_add_and_get() -> None:
    registry = RoomRegistry()
    room, _ = create_room(username="a", icon="1")
    registry.add(room)
    assert registry.get(room.code) is room


def test_registry_get_missing_returns_none() -> None:
    registry = RoomRegistry()
    assert registry.get("NOPE") is None


def test_registry_remove() -> None:
    registry = RoomRegistry()
    room, _ = create_room(username="a", icon="1")
    registry.add(room)
    registry.remove(room.code)
    assert registry.get(room.code) is None


def test_registry_remove_missing_is_noop() -> None:
    registry = RoomRegistry()
    registry.remove("NOPE")

from app.game.models import Room


class RoomRegistry:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}

    def get(self, code: str) -> Room | None:
        return self._rooms.get(code)

    def add(self, room: Room) -> None:
        self._rooms[room.code] = room

    def remove(self, code: str) -> None:
        self._rooms.pop(code, None)

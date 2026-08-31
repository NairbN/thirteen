POINTS_BY_LOBBY_SIZE: dict[int, dict[int, int]] = {
    4: {1: 4, 2: 3, 3: 2, 4: 1},
    3: {1: 3, 2: 2, 3: 1},
    2: {1: 2, 2: 1},
}


def points_for_placement(player_count: int, placement: int) -> int:
    return POINTS_BY_LOBBY_SIZE.get(player_count, {}).get(placement, 0)

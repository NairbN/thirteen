import time
from dataclasses import dataclass, field
from enum import StrEnum

from app.rules_engine import Card, Combo

MAX_SEATS = 4
MIN_SEATS_TO_START = 2
HAND_SIZE = 13

TURN_TIMER_SECONDS = 30
ALL_DISCONNECTED_GRACE_SECONDS = 60
REMATCH_TIMEOUT_SECONDS = 60
ROOM_TTL_WAITING_SECONDS = 30 * 60
ROOM_TTL_FINISHED_SECONDS = 10 * 60


class RoomState(StrEnum):
    WAITING = "waiting"
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    ABANDONED = "abandoned"


class GamePhase(StrEnum):
    AWAITING_LEAD = "awaiting_lead"
    AWAITING_FOLLOW = "awaiting_follow"


class ConnectionState(StrEnum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"


class ParticipationState(StrEnum):
    ACTIVE = "active"
    PASSED = "passed"
    OUT = "out"
    FORFEITED = "forfeited"


class RematchVote(StrEnum):
    NONE = "none"
    ACCEPT = "accept"
    DECLINE = "decline"


class GameError(Exception):
    def __init__(self, code: str, message: str | None = None) -> None:
        self.code = code
        self.message = message or code
        super().__init__(self.message)


@dataclass
class Seat:
    seat_index: int
    session_token: str
    username: str
    icon: str
    is_host: bool = False
    connection: ConnectionState = ConnectionState.CONNECTED
    is_ready: bool = False
    participation: ParticipationState = ParticipationState.ACTIVE
    hand: list[Card] = field(default_factory=list)
    rematch_vote: RematchVote = RematchVote.NONE
    score: int = 0
    placement: int | None = None


@dataclass
class Game:
    phase: GamePhase
    current_seat: int
    pile: Combo | None = None
    last_player_to_play: int | None = None
    is_first_lead: bool = False
    lowest_card_in_play: Card = 0
    placements: list[int] = field(default_factory=list)
    forfeit_order: list[int] = field(default_factory=list)
    turn_deadline: float = 0.0


@dataclass
class Room:
    code: str
    state: RoomState = RoomState.WAITING
    seats: dict[int, Seat] = field(default_factory=dict)
    game: Game | None = None
    game_number: int = 1
    previous_winner: int | None = None
    created_at: float = field(default_factory=time.time)
    last_activity_at: float = field(default_factory=time.time)

    def ordered_seats(self) -> list[Seat]:
        return [self.seats[i] for i in sorted(self.seats)]

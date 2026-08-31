import type { Card } from "@/lib/rules-engine/cards";
import type { Combo } from "@/lib/rules-engine/combos";

export type RoomState = "waiting" | "starting" | "in_progress" | "finished" | "abandoned";
export type GamePhase = "awaiting_lead" | "awaiting_follow";
export type ConnectionState = "connected" | "disconnected";
export type ParticipationState = "active" | "passed" | "out" | "forfeited";
export type RematchVote = "none" | "accept" | "decline";
export type GameOverReason = "normal" | "instant_win" | "players_left";

export interface PublicSeat {
  seatIndex: number;
  username: string;
  icon: string;
  isHost: boolean;
  connection: ConnectionState;
  isReady: boolean;
  participation: ParticipationState;
  handCount: number;
  rematchVote: RematchVote;
  score: number;
  placement: number | null;
}

export interface PublicGame {
  phase: GamePhase;
  currentSeat: number;
  pile: Combo | null;
  lastPlayerToPlay: number | null;
  turnDeadline: number;
}

export interface PublicState {
  code: string;
  state: RoomState;
  seats: PublicSeat[];
  gameNumber: number;
  game: PublicGame | null;
}

export interface GameOverPayload {
  placements: number[];
  points: Record<number, number>;
  scoreboard: Record<number, number>;
  reason: GameOverReason;
}

export const ERROR_CODES = [
  "ROOM_NOT_FOUND",
  "ROOM_FULL",
  "ROOM_LOCKED",
  "INVALID_SESSION",
  "NOT_YOUR_TURN",
  "ILLEGAL_PLAY",
  "MUST_INCLUDE_LOWEST_CARD",
  "LEAD_MAY_NOT_PASS",
  "CARDS_NOT_HELD",
  "WRONG_STATE",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ErrorPayload {
  code: string;
  message: string;
}

export type AckOk<T = Record<string, never>> = { ok: true } & T;
export interface AckErr {
  ok: false;
  code: string;
  message: string;
}
export type AckResult<T = Record<string, never>> = AckOk<T> | AckErr;

export interface RoomCreatePayload {
  username: string;
  icon: string;
}
export interface RoomCreateAck {
  code: string;
  sessionToken: string;
  seatIndex: number;
}

export interface RoomJoinPayload {
  code: string;
  username: string;
  icon: string;
}
export interface RoomJoinAck {
  sessionToken: string;
  seatIndex: number;
}

export interface RoomRejoinPayload {
  code: string;
  sessionToken: string;
}
// Contract only documents `{ ok: true }` for rejoin; seatIndex is included
// defensively in case the server sends it, with a localStorage fallback.
export interface RoomRejoinAck {
  seatIndex?: number;
}

export interface PlayerUpdatePayload {
  username?: string;
  icon?: string;
}

export interface PlayerReadyPayload {
  ready: boolean;
}

export interface GamePlayPayload {
  cards: Card[];
}

export interface GameRematchPayload {
  accept: boolean;
}

export interface GamePlayedPayload {
  seatIndex: number;
  combo: Combo;
}

export interface GamePassedPayload {
  seatIndex: number;
}

export interface RoundResetPayload {
  leadSeat: number;
}

export interface RoomClosedPayload {
  reason: string;
}

export interface ServerToClientEvents {
  "state:sync": (state: PublicState) => void;
  "hand:sync": (payload: { cards: Card[] }) => void;
  "game:played": (payload: GamePlayedPayload) => void;
  "game:passed": (payload: GamePassedPayload) => void;
  "round:reset": (payload: RoundResetPayload) => void;
  "game:over": (payload: GameOverPayload) => void;
  "room:closed": (payload: RoomClosedPayload) => void;
  error: (payload: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  "room:create": (payload: RoomCreatePayload, ack: (res: AckResult<RoomCreateAck>) => void) => void;
  "room:join": (payload: RoomJoinPayload, ack: (res: AckResult<RoomJoinAck>) => void) => void;
  "room:rejoin": (payload: RoomRejoinPayload, ack: (res: AckResult<RoomRejoinAck>) => void) => void;
  "room:leave": (payload: Record<string, never>, ack: (res: AckResult) => void) => void;
  "player:update": (payload: PlayerUpdatePayload, ack: (res: AckResult) => void) => void;
  "player:ready": (payload: PlayerReadyPayload, ack: (res: AckResult) => void) => void;
  "game:play": (payload: GamePlayPayload, ack: (res: AckResult) => void) => void;
  "game:pass": (payload: Record<string, never>, ack: (res: AckResult) => void) => void;
  "game:rematch": (payload: GameRematchPayload, ack: (res: AckResult) => void) => void;
}

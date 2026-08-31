# V1

Rules of play live in [`rules.md`](./rules.md). This document covers scope, state machines, architecture, and the client/server contract.

## Scope

**User accounts**

- Sign in as guest
- Custom username, custom player icon
- Persist username and icon in `localStorage`; the active session token in `sessionStorage` (per-tab — see "Reconnect flow")

**Lobby**

- Create lobby
- Join by link
- Play full games to completion
- Track cumulative points across games
- End screen + rematch flow
- Handle disconnect and reconnect

## Non-Goals (V1)

Explicitly out of scope. Listed so they don't creep in:

- Chat (text or voice)
- Spectators
- Joining a game already in progress
- Persistent accounts, auth providers, or cross-session identity
- Ranked play, matchmaking, ELO, leaderboards
- Multi-process / horizontally scaled server; rooms are in-memory in a single process
- Room persistence across server restart
- Mobile-native clients (responsive web only)
- Replays, game history, statistics
- Animations beyond basic card movement
- Internationalization
- The rule variants listed under "Explicitly Not In These Rules" in `rules.md`

## Stack

| Concern       | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Backend       | Python + FastAPI                                                 |
| Transport     | Socket.IO via `python-socketio`, ASGI-mounted on FastAPI (rooms used for broadcast fan-out) |
| Frontend      | Next.js + TypeScript                                             |
| State storage | In-memory `Map`-equivalent (dict) of `roomCode -> Room` in a single server process |
| Persistence   | None in V1. Server restart destroys all rooms. Supabase (Postgres) is provisioned for later use but unused in V1. |
| Rules engine  | Implemented **twice**: Python (server, authoritative) and TypeScript (client, advisory-only). Kept in sync via one shared JSON fixture (`fixtures/combo-cases.json`, derived from the test tables below) consumed by both the `pytest` and `vitest` suites — any drift between the two implementations fails CI. |
| Hosting       | Frontend on Vercel, backend on Railway (long-running process required for in-memory rooms + WebSocket connections), Supabase for a future Postgres instance |
| Local dev     | Docker Compose runs both services with hot reload; Dockerfiles double as the Railway backend deploy target |
| CI            | GitHub Actions: lint + test for both frontend and backend on every push/PR                                    |

The rules engine is duplicated (not shared as a single module) because the backend and frontend are different languages. The client copy exists purely so the client can **grey out illegal selections** for responsiveness — it is a UX affordance only, never authoritative. See "Authority" below.

## Authority & Hidden Information

**The server is the sole authority on game state.** This is the most important constraint in the system.

- The server owns the deck, the shuffle, and every hand.
- A client receives **its own hand** and, for every other seat, **only a card count**.
- Client-side legality checks are advisory. Every `play` and `pass` is re-validated server-side against the authoritative state, and rejected on failure. A client that has been tampered with can never learn another player's cards or make an illegal play.
- Never broadcast a full-state payload containing all hands and rely on the client to hide the parts it shouldn't see. Private hand data goes only over the owning socket.

Two payload shapes follow from this: a **public state** broadcast to the room, and a **private hand** sent to one socket. They are always emitted as separate events.

## Timers & Constants

| Constant                    | Value  | Meaning                                                                  |
| --------------------------- | ------ | ------------------------------------------------------------------------ |
| `TURN_TIMER`                | 30 s   | Per-turn clock. On expiry the server acts for the seat.                  |
| `ALL_DISCONNECTED_GRACE`    | 60 s   | Every seat disconnected for this long → room destroyed.                  |
| `REMATCH_TIMEOUT`           | 60 s   | Rematch window on the end screen.                                        |
| `ROOM_TTL_WAITING`          | 30 min | Idle time in `waiting` before the room is destroyed.                     |
| `ROOM_TTL_FINISHED`         | 10 min | Idle time in `finished` before the room is destroyed.                    |
| `MAX_SEATS`                 | 4      |                                                                          |
| `MIN_SEATS_TO_START`        | 2      |                                                                          |
| `HAND_SIZE`                 | 13     | Per player, regardless of player count.                                  |

A disconnected seat is **not** given its own grace period during `in_progress` — it stays in the game and the turn timer acts on its behalf, so it may reconnect at any point while the room lives.

## States

**Lobby:** `waiting` → `starting` → `in_progress` → `finished`; `abandoned` is terminal and reachable from any state.

**Game (within `in_progress`):** `awaiting_lead`, `awaiting_follow`.

**Seat:**

- connection: `connected`, `disconnected`
- participation: `active`, `passed`, `out`, `forfeited`

`forfeited` is new: a seat that explicitly quit mid-game. Its cards leave play and it is placed behind every player still holding cards.

## Layer 1 — Room Lifecycle

Entry actions (run on entering the state, before any event is processed):

| State         | Entry action                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `starting`    | Lock joins, clear all ready flags and `placement`s, shuffle, deal `HAND_SIZE` to each seat, set all seats `active`, clear pile and passes, check instant-win hands, resolve the lead seat. Emits `INSTANT_WIN` if any hand qualifies, otherwise `DEAL_COMPLETE`. |
| `in_progress` | Start `TURN_TIMER`, enter Layer 2 at `awaiting_lead`.                                                                                    |
| `finished`    | Freeze game state, compute placements, award points into the lobby scoreboard, clear ready flags, open the rematch window (`REMATCH_TIMEOUT`). |
| `abandoned`   | Destroy room, drop all sockets.                                                                                                          |

Transitions:

| State         | Event                            | Guard                                       | →             | Effect                                                                        |
| ------------- | -------------------------------- | ------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `waiting`     | `JOIN`                           | seats < `MAX_SEATS`                         | `waiting`     | assign seat, broadcast roster                                                 |
| `waiting`     | `JOIN`                           | seats = `MAX_SEATS`                         | `waiting`     | reject `ROOM_FULL`                                                            |
| `waiting`     | `LEAVE` / `DISCONNECT`           | seats > 1                                   | `waiting`     | free seat, clear its ready flag, reassign host if the host left               |
| `waiting`     | `LEAVE` / `DISCONNECT`           | last occupant                               | `abandoned`   | destroy room                                                                  |
| `waiting`     | `READY`                          | `MIN_SEATS_TO_START` ≤ seats ≤ `MAX_SEATS` ∧ all seats ready | `starting` | —                                                            |
| `waiting`     | `READY` / `UNREADY`              | otherwise                                   | `waiting`     | broadcast ready states                                                        |
| `waiting`     | `ROOM_TTL_EXPIRED`               | —                                           | `abandoned`   | destroy room                                                                  |
| `starting`    | `DEAL_COMPLETE`                  | —                                           | `in_progress` | —                                                                             |
| `starting`    | `INSTANT_WIN`                    | —                                           | `finished`    | record placements per the instant-win rule                                    |
| `starting`    | `LEAVE` / `DISCONNECT`           | —                                           | `waiting`     | discard the deal, unlock joins, clear all ready flags                         |
| `in_progress` | `PLAY` / `PASS`                  | —                                           | `in_progress` | delegate to Layer 2                                                           |
| `in_progress` | `TURN_TIMER_EXPIRED`             | —                                           | `in_progress` | delegate to Layer 2                                                           |
| `in_progress` | `GAME_OVER`                      | ≤ 1 seat still holds cards                  | `finished`    | —                                                                             |
| `in_progress` | `LEAVE` (explicit quit)          | ≥ 2 seats would still hold cards            | `in_progress` | mark seat `forfeited`, remove its cards from play, recompute turn if it was theirs |
| `in_progress` | `LEAVE` (explicit quit)          | < 2 seats would still hold cards            | `finished`    | end early, record placements                                                  |
| `in_progress` | `DISCONNECT`                     | —                                           | `in_progress` | mark seat `disconnected`; seat stays in the game, `TURN_TIMER` acts for it     |
| `in_progress` | `RECONNECT`                      | session token matches a seat in this room    | `in_progress` | mark `connected`, send private hand + full public state                       |
| `in_progress` | `ALL_DISCONNECTED_GRACE_EXPIRED` | every seat `disconnected`                   | `abandoned`   | destroy room                                                                  |
| `finished`    | `REMATCH_ACCEPT`                 | all connected seats accepted ∧ ≥ `MIN_SEATS_TO_START` | `starting` | keep seats and scoreboard, lead = previous winner              |
| `finished`    | `REMATCH_ACCEPT`                 | otherwise                                   | `finished`    | broadcast accept states                                                       |
| `finished`    | `REMATCH_DECLINE`                | —                                           | `finished`    | mark declined, broadcast                                                      |
| `finished`    | `REMATCH_TIMEOUT`                | ≥ `MIN_SEATS_TO_START` accepted             | `starting`    | drop non-accepting seats from the room, keep scoreboard                       |
| `finished`    | `REMATCH_TIMEOUT`                | < `MIN_SEATS_TO_START` accepted             | `finished`    | close the rematch window, start `ROOM_TTL_FINISHED`                           |
| `finished`    | `LEAVE` / `DISCONNECT`           | seats > 1                                   | `finished`    | free seat, retain its scoreboard entry for display                            |
| `finished`    | `LEAVE` / `DISCONNECT`           | last occupant                               | `abandoned`   | destroy room                                                                  |
| `finished`    | `ROOM_TTL_EXPIRED`               | —                                           | `abandoned`   | destroy room                                                                  |
| `abandoned`   | —                                | —                                           | —             | terminal                                                                      |

## Layer 2 — Game

Shared definitions:

- **`advanceTurn()`** — move `currentSeat` to the next seat clockwise (`(seatIndex + 1) % seatCount`) whose participation is `active`. Seats that are `passed`, `out`, or `forfeited` are skipped. If no `active` seat exists, the round has ended.
- **`isFirstLead`** — true only for the very first lead of the **first** game of a lobby. While true, a lead must include `lowestCardInPlay`.
- **`lowestCardInPlay`** — the minimum card id across all dealt hands. `3♠` at 4 players; possibly higher at 2–3 players.
- **Out check** — after any successful play, if the acting seat's hand is empty, mark it `out` and append it to `placements`. Then, if ≤ 1 seat still holds cards, emit `GAME_OVER` to Layer 1.

Transitions:

| State             | Event                | Guard                                                                                          | →                 | Effect                                                                                  |
| ----------------- | -------------------- | ---------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `awaiting_lead`   | `PLAY`               | from `currentSeat` ∧ cards held ∧ valid combo ∧ (`isFirstLead` → includes `lowestCardInPlay`)   | `awaiting_follow` | set pile, `lastPlayerToPlay` = seat, clear `isFirstLead`, out check, `advanceTurn()`     |
| `awaiting_lead`   | `PLAY`               | guard fails                                                                                    | `awaiting_lead`   | reject `ILLEGAL_PLAY` (or `MUST_INCLUDE_LOWEST_CARD` / `NOT_YOUR_TURN`)                  |
| `awaiting_lead`   | `PASS`               | —                                                                                              | `awaiting_lead`   | reject `LEAD_MAY_NOT_PASS`                                                              |
| `awaiting_lead`   | `TURN_TIMER_EXPIRED` | —                                                                                              | `awaiting_follow` | auto-play the lowest legal single — `lowestCardInPlay` if `isFirstLead`, else the seat's lowest card — then apply the `PLAY` effect |
| `awaiting_follow` | `PLAY`               | from `currentSeat` ∧ cards held ∧ beats pile (same type + length, or legal bomb chop, or higher bomb) | `awaiting_follow` | set pile, `lastPlayerToPlay` = seat, out check, `advanceTurn()`                    |
| `awaiting_follow` | `PLAY`               | guard fails                                                                                    | `awaiting_follow` | reject `ILLEGAL_PLAY`                                                                   |
| `awaiting_follow` | `PASS`               | ≥ 1 other `active` seat remains                                                                | `awaiting_follow` | mark seat `passed`, `advanceTurn()`                                                     |
| `awaiting_follow` | `PASS`               | no other `active` seat remains                                                                 | `awaiting_lead`   | clear pile, reset all `passed` → `active`, `currentSeat` = `lastPlayerToPlay` if it still holds cards, else the next clockwise seat that does |
| `awaiting_follow` | `TURN_TIMER_EXPIRED` | —                                                                                              | —                 | treat as `PASS`                                                                         |

Every transition restarts `TURN_TIMER` for the new `currentSeat`.

## Layer 3 — Seat State

| Field           | Values / type                            | Scope   | Reset trigger                                                        |
| --------------- | ---------------------------------------- | ------- | -------------------------------------------------------------------- |
| `seatIndex`     | `0..3`                                   | room    | assigned on join, stable until leave                                 |
| `sessionToken`  | opaque string                            | session | issued on first join, used to rebind a seat on reconnect              |
| `username`      | string                                   | session | client-supplied                                                      |
| `icon`          | icon id                                  | session | client-supplied                                                      |
| `isHost`        | boolean                                  | room    | reassigned if the host leaves                                        |
| `connection`    | `connected` \| `disconnected`            | session | driven by socket events only; never auto-resets                      |
| `isReady`       | boolean                                  | lobby   | cleared on entering `starting` and on entering `finished`             |
| `participation` | `active` \| `passed` \| `out` \| `forfeited` | game | `passed` → `active` at each new round; `out` and `forfeited` persist until the next `starting` |
| `hand`          | `Card[]`                                 | game    | replaced on deal                                                     |
| `handCount`     | derived (`hand.length`)                  | —       | the only hand information broadcast publicly                         |
| `rematchVote`   | `none` \| `accept` \| `decline`          | game    | reset on entering `finished`                                         |
| `score`         | integer                                  | lobby   | never reset while the room lives                                     |
| `placement`     | `1..4` \| `null`                         | game    | reset on entering `starting`                                         |

`isMyTurn` is **not** seat state — it is derived client-side as `publicState.currentSeat === mySeatIndex`.

## Data Model

```ts
type Card = number; // 0..51, see rules.md canonical encoding

type ComboType =
  | 'single' | 'pair' | 'triple'
  | 'straight' | 'quad' | 'consecutive_pairs';

interface Combo {
  type: ComboType;
  cards: Card[];
  length: number;   // cards for straight, pairs for consecutive_pairs, else cards
  high: Card;       // max card id — the sole comparison key
  isBomb: boolean;  // quad | consecutive_pairs
}

interface Seat {
  seatIndex: 0 | 1 | 2 | 3;
  sessionToken: string;
  username: string;
  icon: string;
  isHost: boolean;
  connection: 'connected' | 'disconnected';
  isReady: boolean;
  participation: 'active' | 'passed' | 'out' | 'forfeited';
  hand: Card[];              // server-only, never broadcast
  rematchVote: 'none' | 'accept' | 'decline';
  score: number;
  placement: 1 | 2 | 3 | 4 | null;
}

interface Game {
  phase: 'awaiting_lead' | 'awaiting_follow';
  currentSeat: number;
  pile: Combo | null;
  lastPlayerToPlay: number | null;
  isFirstLead: boolean;
  lowestCardInPlay: Card;
  placements: number[];      // seatIndexes, in finishing order
  turnDeadline: number;      // epoch ms
}

interface Room {
  code: string;              // join-link token
  state: 'waiting' | 'starting' | 'in_progress' | 'finished' | 'abandoned';
  seats: Seat[];
  game: Game | null;
  gameNumber: number;        // 1-based; gameNumber === 1 drives isFirstLead
  previousWinner: number | null;
  createdAt: number;
  lastActivityAt: number;    // drives ROOM_TTL_*
}
```

Derived public projection — the only room data broadcast:

```ts
interface PublicSeat {
  seatIndex: number;
  username: string;
  icon: string;
  isHost: boolean;
  connection: 'connected' | 'disconnected';
  isReady: boolean;
  participation: 'active' | 'passed' | 'out' | 'forfeited';
  handCount: number;         // count only — never the cards
  rematchVote: 'none' | 'accept' | 'decline';
  score: number;
  placement: number | null;
}

interface PublicState {
  code: string;
  state: Room['state'];
  seats: PublicSeat[];
  gameNumber: number;
  game: {
    phase: Game['phase'];
    currentSeat: number;
    pile: Combo | null;      // pile cards are public by definition
    lastPlayerToPlay: number | null;
    turnDeadline: number;
  } | null;
}
```

## Socket Contract

All events are namespaced by `:`. Every client→server event takes an ack callback returning `{ ok: true }` or `{ ok: false, code, message }`.

### Client → server

| Event           | Payload                                       | Notes                                                        |
| --------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `room:create`   | `{ username, icon }`                          | Ack returns `{ code, sessionToken, seatIndex }`               |
| `room:join`     | `{ code, username, icon }`                    | Ack returns `{ sessionToken, seatIndex }`                     |
| `room:rejoin`   | `{ code, sessionToken }`                      | Reconnect path; rebinds the existing seat                     |
| `room:leave`    | `{}`                                          | Explicit quit; forfeits mid-game                              |
| `player:update` | `{ username?, icon? }`                        | Only legal in `waiting` and `finished`                        |
| `player:ready`  | `{ ready: boolean }`                          | `waiting` only                                                |
| `game:play`     | `{ cards: Card[] }`                           | Server parses and validates; unordered input is fine          |
| `game:pass`     | `{}`                                          |                                                               |
| `game:rematch`  | `{ accept: boolean }`                         | `finished` only                                               |

### Server → client

| Event            | Payload                                            | Scope           |
| ---------------- | -------------------------------------------------- | --------------- |
| `state:sync`     | `PublicState`                                      | room broadcast  |
| `hand:sync`      | `{ cards: Card[] }`                                | **one socket**  |
| `game:played`    | `{ seatIndex, combo: Combo }`                      | room broadcast  |
| `game:passed`    | `{ seatIndex }`                                    | room broadcast  |
| `round:reset`    | `{ leadSeat }`                                     | room broadcast  |
| `game:over`      | `{ placements, points, scoreboard, reason }`        | room broadcast  |
| `room:closed`    | `{ reason }`                                       | room broadcast  |
| `error`          | `{ code, message }`                                | one socket      |

`reason` on `game:over` is one of `normal`, `instant_win`, `players_left`.

`state:sync` is the source of truth for the client; the granular events (`game:played`, `game:passed`, `round:reset`) exist only to drive animation and are always followed by a `state:sync`. A client that ignores them and renders purely from `state:sync` must still be correct.

### Error codes

`ROOM_NOT_FOUND`, `ROOM_FULL`, `ROOM_LOCKED`, `INVALID_SESSION`, `NOT_YOUR_TURN`, `ILLEGAL_PLAY`, `MUST_INCLUDE_LOWEST_CARD`, `LEAD_MAY_NOT_PASS`, `CARDS_NOT_HELD`, `WRONG_STATE`.

### Reconnect flow

1. Client stores `{ code, sessionToken }` in `sessionStorage` (not `localStorage`) on join — scoped per browser tab, not per browser profile. Sharing it across tabs would mean opening a share link in a second tab of the same browser silently reconnects as whichever seat that browser already holds, with no way to join as a second player short of a different browser/incognito window. `sessionStorage` still survives a reload/reconnect within the same tab (the actual point of this flow), it just doesn't leak into a fresh one.
2. On load or socket reconnect, if a token exists, emit `room:rejoin`.
3. Server looks up the room by code, matches `sessionToken` to a seat, rebinds the socket, sets `connection = connected`.
4. Server emits `hand:sync` to that socket and `state:sync` to the room.
5. If the room is gone or the token doesn't match, ack `ROOM_NOT_FOUND` / `INVALID_SESSION`; the client clears storage and shows the landing screen.

## Combo Detection

The trickiest code in the project: parsing an arbitrary set of selected cards into a `Combo`, or rejecting it. Implement once in the shared module as a pure function.

```ts
function parseCombo(cards: Card[]): Combo | null;
function beats(candidate: Combo, pile: Combo): boolean;
```

`parseCombo` algorithm:

1. Reject empty input or duplicate ids.
2. Sort ascending. Group by rank.
3. Dispatch on `(cards.length, group shape)`:
   - 1 card → `single`
   - 2 cards, 1 group → `pair`
   - 3 cards, 1 group → `triple`
   - 4 cards, 1 group → `quad`
   - all groups of size 2, ≥ 3 groups, ranks consecutive, no rank `2` → `consecutive_pairs` with `length = groupCount`
   - all groups of size 1, ≥ 3 cards, ranks consecutive, no rank `2` → `straight`
   - otherwise → `null`
4. Set `high = max(cards)`, `isBomb = type ∈ {quad, consecutive_pairs}`.

Note the dispatch order: 4 cards of one rank must be tested for `quad` before any other shape, and the `consecutive_pairs` test must precede `straight` (6 cards could otherwise be misread).

`beats` algorithm:

1. If `pile` is all rank `2` and `candidate.isBomb` → apply the **exact** chop table from `rules.md`:
   - 1 two → `quad`, or `consecutive_pairs` with `length === 3`
   - 2 twos → `consecutive_pairs` with `length === 4`
   - 3 twos → `consecutive_pairs` with `length === 5`

   No "at least" comparisons here — the lengths are exact. A 5-pair run does not chop a pair of 2s.
2. If `pile.isBomb` and `candidate.isBomb`:
   - `pile.type === 'quad'` and `candidate` is a 3-pair run → `true` (the sole cross-category exception)
   - same `type` and same `length` → `candidate.high > pile.high`
   - otherwise → `false`
3. Otherwise require `candidate.type === pile.type` and `candidate.length === pile.length`, then return `candidate.high > pile.high`.

There is no global bomb "strength ladder" — bombs match by category. Length is a hard equality check everywhere except the quad → 3-pair-run exception.

### Test cases

`parseCombo` must accept:

| Input                        | Result                            |
| ---------------------------- | --------------------------------- |
| `3♠`                         | single, high `3♠`                 |
| `7♠ 7♥`                      | pair, high `7♥`                   |
| `9♠ 9♣ 9♦`                   | triple                            |
| `3♠ 4♣ 5♦`                   | straight, length 3, high `5♦`     |
| `10♠ J♣ Q♦ K♥ A♠`            | straight, length 5, high `A♠`     |
| `5♠ 5♣ 5♦ 5♥`                | quad, bomb                        |
| `3♠3♣ 4♠4♣ 5♠5♣`             | consecutive_pairs, length 3, bomb |
| `3♠3♣ 4♠4♣ 5♠5♣ 6♠6♣ 7♠7♣ 8♠8♣` | consecutive_pairs, length 6    |

`parseCombo` must reject:

| Input                  | Why                                 |
| ---------------------- | ----------------------------------- |
| `3♠ 4♣`                | 2-card straight — below minimum     |
| `3♠ 4♣ 6♦`             | not consecutive                     |
| `K♠ A♣ 2♦`             | 2 in a straight                     |
| `Q♠ K♣ A♦ 3♥`          | wrap-around                         |
| `A♠A♣ 2♠2♣ 3♠3♣`       | 2 in consecutive pairs + wrap       |
| `3♠3♣ 4♠4♣`            | only 2 pairs — below minimum        |
| `3♠3♣ 5♠5♣ 6♠6♣`       | pair ranks not consecutive          |
| `7♠ 7♣ 8♦`             | no valid shape                      |
| `3♠ 3♠`                | duplicate card                      |

`beats` must satisfy:

| Pile                   | Candidate              | Result | Reason                          |
| ---------------------- | ---------------------- | ------ | ------------------------------- |
| `7♠`                   | `7♥`                   | true   | suit tiebreak                   |
| `7♥`                   | `7♠`                   | false  | lower suit                      |
| `7♠ 7♣`                | `7♦ 7♥`                | true   | pair suit tiebreak              |
| `3♠ 4♣ 5♦`             | `4♠ 5♣ 6♦`             | true   | higher straight, same length    |
| `3♠ 4♣ 5♦`             | `4♠ 5♣ 6♦ 7♥`          | false  | length mismatch                 |
| `9♠ 9♣`                | `10♠ J♣ Q♦`            | false  | type mismatch                   |
| `2♠`                   | `5♠5♣5♦5♥`             | true   | quad chops a single 2           |
| `2♠`                   | `3♠3♣ 4♠4♣ 5♠5♣`       | true   | 3 pairs chops a single 2        |
| `2♠ 2♣`                | `5♠5♣5♦5♥`             | false  | quad cannot chop a pair of 2s   |
| `2♠ 2♣`                | 4 consecutive pairs    | true   | exact chop                      |
| `2♠ 2♣`                | 5 consecutive pairs    | false  | chop is exact, not "at least"   |
| `2♠ 2♣`                | 3 consecutive pairs    | false  | too small                       |
| `2♠ 2♣ 2♦`             | 4 consecutive pairs    | false  | needs exactly 5 pairs           |
| `2♠ 2♣ 2♦`             | 5 consecutive pairs    | true   | exact chop                      |
| `A♠`                   | `5♠5♣5♦5♥`             | false  | bombs only chop 2s              |
| `5♠5♣5♦5♥`             | `9♠9♣9♦9♥`             | true   | quad beats lower quad           |
| `9♠9♣9♦9♥`             | `5♠5♣5♦5♥`             | false  | lower quad                      |
| `A♠A♣A♦A♥`             | `3♠3♣ 4♠4♣ 5♠5♣`       | true   | 3-pair run beats any quad       |
| `3♠3♣ 4♠4♣ 5♠5♣`       | `A♠A♣A♦A♥`             | false  | quad cannot answer a run        |
| `3♠3♣ 4♠4♣ 5♠5♣`       | `4♠4♣ 5♠5♣ 6♠6♣`       | true   | higher 3-pair run               |
| `3♠3♣ 4♠4♣ 5♠5♣`       | 4 consecutive pairs    | false  | runs never cross length         |
| `4♠4♣ 5♠5♣ 6♠6♣ 7♠7♣`  | `5♠5♣ 6♠6♣ 7♠7♣ 8♠8♣`  | true   | higher 4-pair run               |
| `4♠4♣ 5♠5♣ 6♠6♣ 7♠7♣`  | `3♠3♣ 4♠4♣ 5♠5♣`       | false  | 3-pair run cannot answer a 4    |

## Resolved Decisions

- **Turn timer visibility:** visible to all players. `turnDeadline` is broadcast in `PublicState.game`, not sent privately — every client can render the countdown for whichever seat is on turn.
- **Lead timeout behavior:** auto-play the lowest legal single (`lowestCardInPlay` if `isFirstLead`, else the seat's lowest card). The rules make leading mandatory — a lead may never pass — so auto-pass has no valid target seat to fall back to. Losing a cheap card is an acceptable, well-understood AFK penalty.
- **Forfeited seat placement:** always below every seat still holding cards at the moment of forfeit, regardless of when those seats later finish. This removes any incentive to ragequit a losing hand to dodge last place.
- **Scoreboard display:** cumulative totals only, no per-game breakdown. A per-game breakdown is a light form of game history, which V1 explicitly excludes as a non-goal; revisit in V2.

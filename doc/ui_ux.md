# UI/UX

Companion to [`v1_planning.md`](./v1_planning.md) (architecture/contract) and [`rules.md`](./rules.md) (game rules). This document covers screens, layout, and client-side interaction — nothing here changes server authority; see "Authority & Hidden Information" in `v1_planning.md`.

## Direction (revised)

- **Visual style: cartoony jungle.** Superseded the original "clean & minimal" direction per user request. Bright saturated palette, thick dark rounded outlines on every shape (cards, buttons, avatars), soft drop shadows for depth, bouncy/playful hover and press states. Still no external image assets — everything (cards, avatars, background) is built from inline SVG/CSS, just with a much more illustrated, less flat character now. A friendly rounded display font for headings; body text stays legible/readable.
- **Table background: jungle floor.** Replaces the flat green felt. A leaf/vine border framing the play area, a warm dirt-or-wood-plank ground fill in the middle. Static (no parallax/animation) — this is set dressing, not a scene.
- **Cards:** rounded corners, thick outline, a subtle playful shadow. Rank/suit glyphs stay the primary content (still no card-face imagery), just styled to match the cartoony language (chunkier numerals, maybe a slightly bouncy selected/hover state consistent with the existing animation budget below).
- **Avatars: customizable cartoony animal.** Replaces the single-emoji icon picker. Four independent choices, each from a small fixed set: **animal** (base body/head shape — pick ~6, e.g. bear/cat/fox/panda/tiger/bunny), **hat**, **glasses**, **shirt** (each ~5 options including "none" where it makes sense). Composited as one layered SVG. Full detail at landing-screen/lobby-seat size; a simplified (fewer visible details, but still on-model) version is fine at the small opponent-seat avatar size on the table — legibility at a glance matters more than full fidelity there.
  - **Wire format:** the socket contract's `icon: string` field (see `v1_planning.md`) is unchanged in shape and is still fully opaque to the server — it never validates or interprets it. The client now JSON-encodes the four choices into that same string field, e.g. `{"animal":"tiger","hat":"cap","glasses":"round","shirt":"red"}`. No backend change needed. Old single-emoji values are not migrated — this is fine given V1 has no persistence across server restarts.
- **Primary device target:** desktop-first, responsive down. Unchanged.
- **Animation budget:** CSS-transition-only movement for (1) deal — cards sliding from a deck point into the hand fan, (2) play — selected cards sliding from hand to pile, (3) round clear — pile cards fading/sliding out. No physics, no confetti, no 3D flips. Matches the "Animations beyond basic card movement" non-goal in `v1_planning.md`. The cartoony restyle should stay within this budget — richer *look*, not more *motion*.
- **Exit Game button:** every screen inside a room (`waiting`/`in_progress`/`finished`) needs a visible, clearly-labeled exit control that calls `room:leave` (forfeiting if mid-game, per the existing contract) and returns to `/`. This closes a gap in the original component tree, which never surfaced one.

## Routing

Two routes, matching Next.js App Router:

- `/` — landing screen. Guest name + icon selection, create-lobby / join-by-code actions.
- `/room/[code]` — everything else. A single page whose rendered content is driven entirely by `PublicState.state` (`waiting → starting → in_progress → finished`, plus `abandoned`). This mirrors the server's own state machine — there is no separate client route per lobby phase, because the phase is server-authoritative and can change under the client at any time (e.g. a rematch kicks a `finished` room back to `starting`).

## Screens

### Landing (`/`)

- Username input, icon picker (a fixed set of predefined icons — no upload, keeps this consistent with the "no persistence" non-goal).
- "Create Lobby" button → `room:create`, then router push to `/room/[code]`.
- "Join by code" input + button → `room:join`.
- On mount, check `localStorage` for a saved `{ code, sessionToken }`; if present, attempt `room:rejoin` and redirect straight into the room on success.

### Lobby (`/room/[code]`, `state: waiting`)

- Seat list (`SeatCard` per occupied seat): avatar/icon, username, host badge, ready toggle/indicator.
- Empty seats shown as open slots up to `MAX_SEATS`.
- `ShareLinkBox` — copyable room link.
- "Ready" toggle for the local seat; host sees implicit start-when-all-ready (no separate "start" button — the `READY` transition in `v1_planning.md` fires automatically once all seats are ready and seat count is in range).

### Table (`/room/[code]`, `state: in_progress`, also covers the brief `starting` transition)

Oval table, self always bottom-center:

- **Self hand (`SelfHand`)** — fanned horizontally. Click to select/deselect cards (multi-select). Selected cards lift (`translateY`). `parseCombo`/`beats` from `src/lib/rules-engine` run client-side on the current selection against `pile` to grey out an illegal Play button — advisory only, server re-validates every `game:play`.
- **Opponent seats (`OpponentSeat`)** — positioned around the oval above self: 1 opponent at 2p (top), top-left/top-right at 3p, left/top/right at 4p. Each shows avatar, username, a card-back fan sized to `handCount`, and status tags for `disconnected` / `passed` / `out` / `forfeited`.
- **Pile** — center, shows the last-played `Combo` with a pointer back to `lastPlayerToPlay`.
- **Turn timer** — a radial countdown ring around whichever seat is `currentSeat`, driven by `turnDeadline` from `PublicState.game` (visible to all — see `v1_planning.md` "Resolved Decisions").
- **ActionBar** — Play / Pass buttons; Pass is hidden/disabled entirely while `phase === 'awaiting_lead'` (leading may never pass, per `rules.md`). Server rejections (`ILLEGAL_PLAY`, `NOT_YOUR_TURN`, etc.) surface as a toast.
- **ScoreboardStrip** — small persistent corner strip, cumulative points per seat only (no per-game breakdown, per the resolved decision).

### End screen (`/room/[code]`, `state: finished`)

- `PlacementsList` — this game's 1st/2nd/3rd/4th (or fewer, by lobby size), with `reason` (`normal` / `instant_win` / `players_left`) called out when not `normal`.
- `ScoreboardTable` — cumulative totals across the lobby's games so far.
- `RematchControls` — accept/decline, with the `REMATCH_TIMEOUT` countdown visible.

### Cross-cutting

- **Toast** — renders `error` socket events (`ROOM_NOT_FOUND`, `ILLEGAL_PLAY`, etc.) and the granular animation-only events (`game:played`, `game:passed`, `round:reset`) if used to drive animation; the client must still render correctly from `state:sync` alone if these are ignored.
- **ReconnectOverlay** — shown when the socket disconnects; attempts `room:rejoin` using the stored `{ code, sessionToken }` on reconnect, per the Reconnect Flow in `v1_planning.md`.

## Component tree

```
App
├── (/) LandingScreen
├── (/room/[code]) RoomScreen        — switches on PublicState.state
│   ├── LobbyScreen (state: waiting)
│   │   ├── SeatCard × N
│   │   └── ShareLinkBox
│   ├── TableScreen (state: starting | in_progress)
│   │   ├── OpponentSeat × (N-1)     — positioned via computed oval coordinates
│   │   ├── Pile
│   │   ├── SelfHand
│   │   │   └── Card (selectable)
│   │   ├── ActionBar
│   │   └── ScoreboardStrip
│   └── EndScreen (state: finished)
│       ├── PlacementsList
│       ├── ScoreboardTable
│       └── RematchControls
└── shared: Toast, ReconnectOverlay
```

## State management

Zustand store mirroring the socket contract 1:1: `PublicState` (room broadcast), local `hand: Card[]` (from `hand:sync`, one socket only), connection status, and pending-selection UI state (selected card ids, not server state). The socket client is a thin wrapper that dispatches into the store on every server event — components read from the store, never from the socket directly.

## Responsive fallback

Below a width threshold, the oval compresses toward vertical: opponent seats stack closer to the top edge, hand fan overlap increases (or becomes horizontally scrollable) to fit narrow viewports without a separate mobile-specific layout.

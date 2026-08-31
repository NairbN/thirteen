---
name: run
description: Launch and drive Thirteen (the Tien Len game) locally via Docker Compose, and verify multiplayer flows with two isolated Playwright browser contexts. Use whenever asked to run, test, or QA this app, or to confirm a change works for real before calling it done.
---

# Running Thirteen

Full stack: `frontend/` (Next.js) + `backend/` (FastAPI + python-socketio), see `doc/v1_planning.md`.

## Local dev stack

```bash
cd c:\Users\Brian\Workspace\thirteen
docker compose up -d          # frontend :3000, backend :8000
docker compose build frontend && docker compose up -d frontend   # after a frontend code change
docker compose build backend && docker compose up -d backend     # after a backend code change
curl -s http://localhost:8000/health   # {"status":"ok"} confirms backend is up
```

Leave the stack running after verifying — it's meant to serve as the user's dev environment to click around in, not just a test fixture to tear down.

## Verifying a multiplayer flow (two players)

This is a real-time app: any meaningful check needs two independent clients (separate cookies/localStorage) talking to each other, not one tab. Use Playwright with two separate browser **contexts** (not two tabs of the same context — they'd share localStorage and clobber each other's session token).

If Playwright isn't installed yet:
```bash
npx playwright install chromium
```
Then run scripts from the scratchpad dir with `node your_script.js`.

Skeleton (adapt selectors as the UI evolves — check current text/roles with a screenshot first if a selector stops matching):

```js
const { chromium } = require("playwright");
const browser = await chromium.launch();
const pageA = await (await browser.newContext()).newPage();
const pageB = await (await browser.newContext()).newPage();

await pageA.goto("http://localhost:3000");
await pageB.goto("http://localhost:3000");
await pageA.getByPlaceholder("Your name").fill("Alice");
await pageA.getByRole("button", { name: "Create Lobby" }).click();
await pageA.waitForURL(/\/room\//);
const code = pageA.url().split("/room/")[1];

await pageB.getByPlaceholder("Your name").fill("Bob");
await pageB.getByPlaceholder(/code/i).fill(code);
await pageB.getByRole("button", { name: /join/i }).click();
await pageB.waitForURL(/\/room\//);

await pageA.getByRole("button", { name: /ready/i }).first().click();
await pageB.getByRole("button", { name: /ready/i }).first().click();
// both now on the table screen if no instant win; check body text for "state":"finished"
// equivalent to detect the rare instant-win case
```

**Determine who leads** (don't assume): select a card in one hand, check whether that page's Play button becomes enabled; the OTHER page leads if not. Always deselect again before entering a play loop, or round 1 will toggle the same card back off.

**Gotchas hit before:**
- `page.locator("button").filter({ hasText: /^[0-9AJQK]/ })` matches self-hand cards AND the Pile's played-card display (`Pile.tsx` renders cards via the same `Card` component at `size="sm"`, non-interactive). Scope more precisely if you need to disambiguate them (e.g. by parent container) rather than assuming `.first()` is always the self-hand.
- A card click can legitimately be disabled for ~150-200ms during the deal/leave CSS transition (see `doc/ui_ux.md`'s animation budget) — a brief retry-wait is normal, not a bug. If a card stays disabled far longer than that, it's a real bug (see the ghost-card race fixed in `SelfHand.tsx` — the backend resends `hand:sync` on every room mutation, which can produce a rapid pair of renders with an unchanged-content-but-new-reference `hand` prop).
- Playing a full 2-player game to completion is cheap to script: whoever leads first keeps leading every round if the follower always passes (round always resets back to the same leader in 2p), so 13 rounds of `select lowest card -> Play -> other player Pass` reaches game-over deterministically.
- WebSocket frame inspection (`page.on("websocket", ws => ws.on("framereceived", ...))`) is the fastest way to debug a state-sync mismatch — the raw Engine.IO frames (`42["event",payload]`) show exactly what the server sent, cutting out any doubt about client-side reducer bugs vs. server bugs.

## Deployment

Auto-deploys on push to `main` on both platforms — a plain `git push` is normally all that's needed.

- **Frontend (Vercel)**, project `nairbn/thirteen`, root directory `frontend`: `cd frontend && vercel ls thirteen` to check deploy status; `vercel env add NAME production` to add/update an env var (triggers a redeploy); `vercel project update thirteen --root-directory frontend` if the root directory setting is ever lost (it does NOT persist through `railway`-equivalent redeploy-of-old-config bugs the way Railway's did — but double check after any project recreation).
- **Backend (Railway)**, project `thirteen`, service `backend`, root directory `backend` (set via `railway api` GraphQL — the `Builder` enum has no `DOCKERFILE` value; leave `builder` unset and it auto-detects the Dockerfile once `rootDirectory` is correct): `railway deployment list --service backend --json` to check status; `railway logs --service backend` for runtime logs; to force a fresh deploy from current service config (not just re-run the last one) use the `serviceInstanceDeploy` GraphQL mutation via `railway api`, not `railway redeploy` (that replays the OLD deployment's manifest, including a stale root directory).
- Health checks: backend `https://backend-production-5e0e.up.railway.app/health`, frontend `https://thirteen-gilt.vercel.app`.
- CORS: backend's `FRONTEND_ORIGIN` env var must match the live frontend URL exactly (`railway variable set "FRONTEND_ORIGIN=..." --service backend`, then redeploy).

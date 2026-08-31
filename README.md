# Thirteen

Tien Len ("Thirteen"), a 2–4 player card game, played online. Design docs live in [`doc/`](./doc): [`rules.md`](./doc/rules.md) covers the rules of play, [`v1_planning.md`](./doc/v1_planning.md) covers scope, architecture, state machines, and the client/server contract.

## Structure

```
frontend/    Next.js + TypeScript client
backend/     FastAPI + python-socketio game server
fixtures/    combo-cases.json — shared rules-engine test data, consumed by both suites
```

## Running locally

**Everything, via Docker Compose** (hot reload on both services):

```
docker compose up
```

Frontend at `http://localhost:3000`, backend at `http://localhost:8000` (health check at `/health`).

**Frontend only**, without Docker:

```
cd frontend
npm install
npm run dev
```

**Backend only**, without Docker:

```
cd backend
python -m venv .venv
.venv/Scripts/activate   # .venv/bin/activate on macOS/Linux
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Testing

```
cd frontend && npm run test      # vitest
cd backend  && pytest            # pytest
```

The rules engine (combo parsing + comparison) is implemented independently in both the backend (Python, authoritative) and frontend (TypeScript, advisory-only — used to grey out illegal selections client-side). Both implementations are exercised against the same `fixtures/combo-cases.json`, so any behavioral drift between them fails CI.

## CI

GitHub Actions (`.github/workflows/ci.yml`) lints, type-checks, and tests both frontend and backend on every push/PR, plus validates the shared fixture JSON.

## Deploys

| Service  | Target   | Notes |
| -------- | -------- | ----- |
| Frontend | Vercel   | Native Next.js build, not the Docker image |
| Backend  | Railway  | Long-running process — required for in-memory game rooms and WebSocket connections |
| Database | Supabase | Provisioned for future use; unused by V1 |

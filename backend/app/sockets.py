import socketio

from app.config import settings

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.frontend_origin],
)


@sio.event
async def connect(sid: str, environ: dict) -> None:
    pass


@sio.event
async def disconnect(sid: str) -> None:
    pass

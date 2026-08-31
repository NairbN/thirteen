import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.sockets import sio

fastapi_app = FastAPI(title="Thirteen")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

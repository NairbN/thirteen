import asyncio
from collections.abc import Awaitable, Callable

_tasks: dict[tuple[str, str], asyncio.Task] = {}


def cancel(code: str, kind: str) -> None:
    task = _tasks.pop((code, kind), None)
    if task and not task.done():
        task.cancel()


def cancel_all(code: str) -> None:
    for key in [k for k in _tasks if k[0] == code]:
        cancel(*key)


def schedule(code: str, kind: str, delay: float, callback: Callable[[], Awaitable[None]]) -> None:
    cancel(code, kind)

    async def runner() -> None:
        try:
            await asyncio.sleep(delay)
        except asyncio.CancelledError:
            return
        _tasks.pop((code, kind), None)
        await callback()

    _tasks[(code, kind)] = asyncio.create_task(runner())

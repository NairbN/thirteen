"""Manual integration check: two real socket.io clients play through a room's
opening moves against a live server. Not part of the pytest suite -- it needs
a running server (see README) since it exercises the actual network transport,
not just the pure engine.

Usage: python scripts/smoke_test.py [server_url]
"""

import asyncio
import sys

import socketio


async def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"

    alice = socketio.AsyncClient()
    bob = socketio.AsyncClient()

    alice_events: list[tuple[str, dict]] = []
    bob_events: list[tuple[str, dict]] = []

    def track(events: list[tuple[str, dict]]):
        def handler(name):
            async def _handler(data):
                events.append((name, data))

            return _handler

        return handler

    event_names = [
        "state:sync",
        "hand:sync",
        "game:played",
        "game:passed",
        "round:reset",
        "game:over",
    ]
    for name in event_names:
        alice.on(name, track(alice_events)(name))
        bob.on(name, track(bob_events)(name))

    await alice.connect(url, socketio_path="socket.io", transports=["websocket"])
    await bob.connect(url, socketio_path="socket.io", transports=["websocket"])
    print("connected both clients")

    created = await alice.call("room:create", {"username": "alice", "icon": "cat"})
    assert created["ok"], created
    code = created["code"]
    print(f"room created: {code}")

    joined = await bob.call("room:join", {"code": code, "username": "bob", "icon": "dog"})
    assert joined["ok"], joined
    print("bob joined")

    await asyncio.sleep(0.2)
    ready_a = await alice.call("player:ready", {"ready": True})
    assert ready_a["ok"], ready_a
    ready_b = await bob.call("player:ready", {"ready": True})
    assert ready_b["ok"], ready_b
    await asyncio.sleep(0.2)

    alice_hand = next(d["cards"] for name, d in reversed(alice_events) if name == "hand:sync")
    bob_hand = next(d["cards"] for name, d in reversed(bob_events) if name == "hand:sync")
    state = next(d for name, d in reversed(alice_events) if name == "state:sync")
    print(
        f"dealt: alice={len(alice_hand)} cards, bob={len(bob_hand)} cards, "
        f"room state={state['state']}"
    )

    if state["state"] == "finished":
        print("instant win on this deal -- join/ready/deal path still fully validated")
        await alice.disconnect()
        await bob.disconnect()
        return

    assert state["state"] == "in_progress"
    current_seat = state["game"]["currentSeat"]
    is_alice_lead = current_seat == created["seatIndex"]
    leader, leader_hand = (alice, alice_hand) if is_alice_lead else (bob, bob_hand)
    lowest = min(leader_hand)

    play_result = await leader.call("game:play", {"cards": [lowest]})
    assert play_result["ok"], play_result
    print(f"seat {current_seat} led with card id {lowest}")

    await asyncio.sleep(0.2)
    follower = bob if leader is alice else alice
    pass_result = await follower.call("game:pass", {})
    assert pass_result["ok"], pass_result
    print("follower passed")

    await asyncio.sleep(0.2)
    print("SMOKE TEST PASSED: create -> join -> ready -> deal -> play -> pass all round-tripped")

    await alice.disconnect()
    await bob.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

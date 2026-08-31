import { beforeEach, describe, expect, it } from "vitest";
import { parseCard } from "@/lib/rules-engine/cards";
import type { PublicState } from "@/lib/socket/types";
import { useGameStore } from "./gameStore";

function samplePublicState(overrides: Partial<PublicState> = {}): PublicState {
  return {
    code: "ABCD",
    state: "in_progress",
    gameNumber: 1,
    seats: [
      {
        seatIndex: 0,
        username: "Alice",
        icon: "🐯",
        isHost: true,
        connection: "connected",
        isReady: true,
        participation: "active",
        handCount: 13,
        rematchVote: "none",
        score: 0,
        placement: null,
      },
      {
        seatIndex: 1,
        username: "Bob",
        icon: "🐼",
        isHost: false,
        connection: "connected",
        isReady: true,
        participation: "active",
        handCount: 13,
        rematchVote: "none",
        score: 0,
        placement: null,
      },
    ],
    game: {
      phase: "awaiting_lead",
      currentSeat: 0,
      pile: null,
      lastPlayerToPlay: null,
      turnDeadline: Date.now() + 30_000,
    },
    ...overrides,
  };
}

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  it("applyStateSync stores the public state and room code", () => {
    const state = samplePublicState();
    useGameStore.getState().applyStateSync(state);
    expect(useGameStore.getState().publicState).toEqual(state);
    expect(useGameStore.getState().roomCode).toBe("ABCD");
  });

  it("applyHandSync replaces the hand and prunes stale selections", () => {
    const store = useGameStore.getState();
    const sevenS = parseCard("7S");
    const eightD = parseCard("8D");
    store.toggleCardSelection(sevenS);
    store.toggleCardSelection(eightD);
    expect(useGameStore.getState().selectedCardIds).toEqual([sevenS, eightD]);

    store.applyHandSync([eightD, parseCard("9C")]);

    expect(useGameStore.getState().hand).toEqual([eightD, parseCard("9C")]);
    expect(useGameStore.getState().selectedCardIds).toEqual([eightD]);
  });

  it("toggleCardSelection adds and removes card ids", () => {
    const store = useGameStore.getState();
    const card = parseCard("3S");
    store.toggleCardSelection(card);
    expect(useGameStore.getState().selectedCardIds).toContain(card);
    store.toggleCardSelection(card);
    expect(useGameStore.getState().selectedCardIds).not.toContain(card);
  });

  it("clearSelection empties the selection", () => {
    const store = useGameStore.getState();
    store.toggleCardSelection(parseCard("3S"));
    store.clearSelection();
    expect(useGameStore.getState().selectedCardIds).toEqual([]);
  });

  it("applyGamePlayed pushes an info toast naming the seat", () => {
    useGameStore.getState().applyStateSync(samplePublicState());
    useGameStore.getState().applyGamePlayed({
      seatIndex: 1,
      combo: { type: "single", cards: [parseCard("7S")], length: 1, high: parseCard("7S"), isBomb: false },
    });
    const toasts = useGameStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toContain("Bob");
  });

  it("applyGamePassed pushes an info toast naming the seat", () => {
    useGameStore.getState().applyStateSync(samplePublicState());
    useGameStore.getState().applyGamePassed({ seatIndex: 0 });
    expect(useGameStore.getState().toasts[0].message).toContain("Alice");
  });

  it("pushToast/dismissToast add and remove toasts", () => {
    const store = useGameStore.getState();
    store.pushToast({ variant: "error", message: "boom" });
    const id = useGameStore.getState().toasts[0].id;
    store.dismissToast(id);
    expect(useGameStore.getState().toasts).toEqual([]);
  });

  it("applyRoomClosed resets the room and pushes a toast", () => {
    useGameStore.getState().setSession("ABCD", "token", 0);
    useGameStore.getState().applyStateSync(samplePublicState());
    useGameStore.getState().applyRoomClosed({ reason: "players_left" });

    const state = useGameStore.getState();
    expect(state.roomCode).toBeNull();
    expect(state.publicState).toBeNull();
    expect(state.toasts.some((t) => t.variant === "error")).toBe(true);
  });

  it("setSession and clearSession manage identity", () => {
    useGameStore.getState().setSession("WXYZ", "tok", 2);
    expect(useGameStore.getState().mySeatIndex).toBe(2);
    useGameStore.getState().clearSession();
    expect(useGameStore.getState().mySeatIndex).toBeNull();
    expect(useGameStore.getState().roomCode).toBeNull();
  });
});

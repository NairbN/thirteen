import { create } from "zustand";
import type { Card } from "@/lib/rules-engine/cards";
import type {
  GameOverPayload,
  GamePassedPayload,
  GamePlayedPayload,
  PublicState,
  RoomClosedPayload,
  RoundResetPayload,
} from "@/lib/socket/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
export type SessionRestoreStatus = "idle" | "checking" | "resolved";
export type ToastVariant = "error" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  code?: string;
}

let toastSeq = 0;
function nextToastId(): string {
  toastSeq += 1;
  return `toast-${toastSeq}`;
}

// Caps concurrent toasts so a burst of game:played/game:passed events can
// never outpace auto-dismiss and stack up over primary screen content.
const MAX_CONCURRENT_TOASTS = 3;

export interface GameStoreState {
  roomCode: string | null;
  sessionToken: string | null;
  mySeatIndex: number | null;
  sessionRestore: SessionRestoreStatus;

  publicState: PublicState | null;
  hand: Card[];
  lastGameOver: GameOverPayload | null;
  lastRoundReset: RoundResetPayload | null;

  connectionStatus: ConnectionStatus;

  selectedCardIds: Card[];
  toasts: ToastItem[];

  setSession: (code: string, sessionToken: string, seatIndex: number) => void;
  clearSession: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSessionRestore: (status: SessionRestoreStatus) => void;

  applyStateSync: (state: PublicState) => void;
  applyHandSync: (cards: Card[]) => void;
  applyGamePlayed: (payload: GamePlayedPayload) => void;
  applyGamePassed: (payload: GamePassedPayload) => void;
  applyRoundReset: (payload: RoundResetPayload) => void;
  applyGameOver: (payload: GameOverPayload) => void;
  applyRoomClosed: (payload: RoomClosedPayload) => void;

  toggleCardSelection: (card: Card) => void;
  clearSelection: () => void;

  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;

  resetRoom: () => void;
}

function usernameForSeat(state: PublicState | null, seatIndex: number): string {
  return state?.seats.find((s) => s.seatIndex === seatIndex)?.username ?? `Seat ${seatIndex + 1}`;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  roomCode: null,
  sessionToken: null,
  mySeatIndex: null,
  sessionRestore: "idle",

  publicState: null,
  hand: [],
  lastGameOver: null,
  lastRoundReset: null,

  connectionStatus: "connecting",

  selectedCardIds: [],
  toasts: [],

  setSession: (code, sessionToken, seatIndex) =>
    set({ roomCode: code, sessionToken, mySeatIndex: seatIndex }),

  clearSession: () =>
    set({ roomCode: null, sessionToken: null, mySeatIndex: null, publicState: null, hand: [], selectedCardIds: [] }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSessionRestore: (status) => set({ sessionRestore: status }),

  applyStateSync: (state) => set({ publicState: state, roomCode: state.code }),

  applyHandSync: (cards) =>
    set((s) => ({
      hand: cards,
      selectedCardIds: s.selectedCardIds.filter((id) => cards.includes(id)),
    })),

  applyGamePlayed: (payload) => {
    const state = get().publicState;
    get().pushToast({
      variant: "info",
      message: `${usernameForSeat(state, payload.seatIndex)} played ${payload.combo.type.replace("_", " ")}`,
    });
  },

  applyGamePassed: (payload) => {
    const state = get().publicState;
    get().pushToast({ variant: "info", message: `${usernameForSeat(state, payload.seatIndex)} passed` });
  },

  applyRoundReset: (payload) => set({ lastRoundReset: payload }),

  applyGameOver: (payload) => set({ lastGameOver: payload }),

  applyRoomClosed: (payload) => {
    get().pushToast({ variant: "error", message: `Room closed: ${payload.reason}` });
    get().resetRoom();
  },

  toggleCardSelection: (card) =>
    set((s) => ({
      selectedCardIds: s.selectedCardIds.includes(card)
        ? s.selectedCardIds.filter((id) => id !== card)
        : [...s.selectedCardIds, card],
    })),

  clearSelection: () => set({ selectedCardIds: [] }),

  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: nextToastId() }].slice(-MAX_CONCURRENT_TOASTS),
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  resetRoom: () =>
    set({
      roomCode: null,
      sessionToken: null,
      mySeatIndex: null,
      publicState: null,
      hand: [],
      selectedCardIds: [],
      lastGameOver: null,
      lastRoundReset: null,
    }),
}));

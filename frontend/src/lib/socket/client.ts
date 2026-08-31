import { io, type Socket } from "socket.io-client";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/lib/storage";
import { useGameStore } from "@/store/gameStore";
import type {
  AckResult,
  ClientToServerEvents,
  GamePlayPayload,
  PlayerReadyPayload,
  PlayerUpdatePayload,
  RoomCreateAck,
  RoomJoinAck,
  RoomRejoinAck,
  ServerToClientEvents,
} from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function emitWithAck<T = Record<string, never>>(
  socket: Socket<ServerToClientEvents, ClientToServerEvents>,
  event: keyof ClientToServerEvents,
  payload: unknown,
): Promise<AckResult<T>> {
  return new Promise((resolve) => {
    // socket.io's typed emit signature doesn't line up with a single generic
    // helper across every event's distinct payload/ack shape; cast at the
    // one call site instead of losing type safety on every event definition.
    (socket.emit as (event: string, payload: unknown, ack: (res: AckResult<T>) => void) => void)(
      event,
      payload,
      resolve,
    );
  });
}

export class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private rejoinInFlight = false;

  constructor() {
    this.socket = io(BACKEND_URL, { autoConnect: false });
    this.wireEvents();
  }

  connect(): void {
    if (!this.socket.connected) this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  private wireEvents(): void {
    this.socket.on("connect", () => {
      useGameStore.getState().setConnectionStatus("connected");
      void this.attemptStoredRejoin();
    });
    this.socket.on("disconnect", () => {
      useGameStore.getState().setConnectionStatus("disconnected");
    });
    this.socket.on("state:sync", (state) => useGameStore.getState().applyStateSync(state));
    this.socket.on("hand:sync", ({ cards }) => useGameStore.getState().applyHandSync(cards));
    this.socket.on("game:played", (payload) => useGameStore.getState().applyGamePlayed(payload));
    this.socket.on("game:passed", (payload) => useGameStore.getState().applyGamePassed(payload));
    this.socket.on("round:reset", (payload) => useGameStore.getState().applyRoundReset(payload));
    this.socket.on("game:over", (payload) => useGameStore.getState().applyGameOver(payload));
    this.socket.on("room:closed", (payload) => useGameStore.getState().applyRoomClosed(payload));
    this.socket.on("error", (payload) => {
      useGameStore.getState().pushToast({ variant: "error", message: payload.message, code: payload.code });
    });
  }

  async attemptStoredRejoin(): Promise<void> {
    if (this.rejoinInFlight) return;
    const session = getStoredSession();
    const store = useGameStore.getState();
    if (!session) {
      store.setSessionRestore("resolved");
      return;
    }
    this.rejoinInFlight = true;
    store.setSessionRestore("checking");
    const res = await emitWithAck<RoomRejoinAck>(this.socket, "room:rejoin", {
      code: session.code,
      sessionToken: session.sessionToken,
    });
    this.rejoinInFlight = false;
    if (res.ok) {
      const seatIndex = res.seatIndex ?? session.seatIndex;
      setStoredSession({ code: session.code, sessionToken: session.sessionToken, seatIndex });
      useGameStore.getState().setSession(session.code, session.sessionToken, seatIndex);
    } else {
      clearStoredSession();
      useGameStore.getState().pushToast({
        variant: "error",
        message:
          res.code === "ROOM_NOT_FOUND"
            ? "Your previous lobby is no longer available -- everyone left."
            : "Couldn't rejoin your previous lobby.",
        code: res.code,
      });
    }
    useGameStore.getState().setSessionRestore("resolved");
  }

  async createRoom(username: string, icon: string): Promise<AckResult<RoomCreateAck>> {
    const res = await emitWithAck<RoomCreateAck>(this.socket, "room:create", { username, icon });
    if (res.ok) {
      setStoredSession({ code: res.code, sessionToken: res.sessionToken, seatIndex: res.seatIndex });
      useGameStore.getState().setSession(res.code, res.sessionToken, res.seatIndex);
    }
    return res;
  }

  async joinRoom(code: string, username: string, icon: string): Promise<AckResult<RoomJoinAck>> {
    const res = await emitWithAck<RoomJoinAck>(this.socket, "room:join", { code, username, icon });
    if (res.ok) {
      setStoredSession({ code, sessionToken: res.sessionToken, seatIndex: res.seatIndex });
      useGameStore.getState().setSession(code, res.sessionToken, res.seatIndex);
    }
    return res;
  }

  async rejoinRoom(code: string, sessionToken: string): Promise<AckResult<RoomRejoinAck>> {
    const res = await emitWithAck<RoomRejoinAck>(this.socket, "room:rejoin", { code, sessionToken });
    if (res.ok) {
      const seatIndex = res.seatIndex ?? -1;
      setStoredSession({ code, sessionToken, seatIndex });
      useGameStore.getState().setSession(code, sessionToken, seatIndex);
    }
    return res;
  }

  async leaveRoom(): Promise<AckResult> {
    const res = await emitWithAck(this.socket, "room:leave", {});
    if (res.ok) {
      clearStoredSession();
      useGameStore.getState().resetRoom();
    }
    return res;
  }

  updatePlayer(payload: PlayerUpdatePayload): Promise<AckResult> {
    return emitWithAck(this.socket, "player:update", payload);
  }

  setReady(payload: PlayerReadyPayload): Promise<AckResult> {
    return emitWithAck(this.socket, "player:ready", payload);
  }

  play(payload: GamePlayPayload): Promise<AckResult> {
    return emitWithAck(this.socket, "game:play", payload);
  }

  pass(): Promise<AckResult> {
    return emitWithAck(this.socket, "game:pass", {});
  }

  rematch(accept: boolean): Promise<AckResult> {
    return emitWithAck(this.socket, "game:rematch", { accept });
  }
}

let singleton: SocketClient | null = null;

export function getSocketClient(): SocketClient {
  if (typeof window === "undefined") {
    throw new Error("SocketClient is browser-only");
  }
  if (!singleton) {
    singleton = new SocketClient();
    singleton.connect();
  }
  return singleton;
}

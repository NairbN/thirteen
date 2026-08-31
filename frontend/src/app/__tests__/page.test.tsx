import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "@/store/gameStore";
import Home from "../page";

const pushMock = vi.fn();
const createRoomMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("@/lib/socket/client", () => ({
  getSocketClient: () => ({
    createRoom: createRoomMock,
    joinRoom: vi.fn(),
  }),
}));

describe("Home", () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
    pushMock.mockReset();
    createRoomMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("renders the landing screen", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Thirteen" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
  });

  it("disables Create Lobby until a username is entered", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Create Lobby" })).toBeDisabled();
  });

  it("creates a room via the socket client, never emitting directly", async () => {
    createRoomMock.mockResolvedValue({ ok: true, code: "ABCD", sessionToken: "tok", seatIndex: 0 });
    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByPlaceholderText("Your name"), "Alice");
    await user.click(screen.getByRole("button", { name: "Create Lobby" }));

    expect(createRoomMock).toHaveBeenCalledWith("Alice", expect.any(String));
    expect(pushMock).toHaveBeenCalledWith("/room/ABCD");
  });
});

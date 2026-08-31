import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCard } from "@/lib/rules-engine/cards";
import { parseCombo } from "@/lib/rules-engine/combos";
import { useGameStore } from "@/store/gameStore";
import ActionBar from "./ActionBar";

const playMock = vi.fn();
const passMock = vi.fn();

vi.mock("@/lib/socket/client", () => ({
  getSocketClient: () => ({ play: playMock, pass: passMock }),
}));

describe("ActionBar", () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
    playMock.mockReset().mockResolvedValue({ ok: true });
    passMock.mockReset().mockResolvedValue({ ok: true });
  });

  it("hides Pass while awaiting_lead", () => {
    render(<ActionBar phase="awaiting_lead" pile={null} isMyTurn selectedCardIds={[]} />);
    expect(screen.queryByRole("button", { name: "Pass" })).not.toBeInTheDocument();
  });

  it("shows Pass while awaiting_follow", () => {
    render(<ActionBar phase="awaiting_follow" pile={null} isMyTurn selectedCardIds={[]} />);
    expect(screen.getByRole("button", { name: "Pass" })).toBeInTheDocument();
  });

  it("disables Play when the selection is not a legal combo", () => {
    render(
      <ActionBar
        phase="awaiting_lead"
        pile={null}
        isMyTurn
        selectedCardIds={[parseCard("7S"), parseCard("8D")]}
      />,
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("disables Play when it is not the player's turn, even with a legal combo", () => {
    render(<ActionBar phase="awaiting_lead" pile={null} isMyTurn={false} selectedCardIds={[parseCard("7S")]} />);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
  });

  it("enables Play for a legal beating combo and submits via the socket client", async () => {
    const pile = parseCombo([parseCard("7S")])!;
    const user = userEvent.setup();
    render(<ActionBar phase="awaiting_follow" pile={pile} isMyTurn selectedCardIds={[parseCard("7H")]} />);

    const playButton = screen.getByRole("button", { name: "Play" });
    expect(playButton).toBeEnabled();

    await user.click(playButton);
    expect(playMock).toHaveBeenCalledWith({ cards: [parseCard("7H")] });
  });
});

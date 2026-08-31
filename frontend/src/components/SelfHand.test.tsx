import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseCard } from "@/lib/rules-engine/cards";
import SelfHand from "./SelfHand";

const toggleCardSelectionMock = vi.fn();

vi.mock("@/store/gameStore", () => ({
  useGameStore: (selector: (s: { toggleCardSelection: typeof toggleCardSelectionMock }) => unknown) =>
    selector({ toggleCardSelection: toggleCardSelectionMock }),
}));

describe("SelfHand", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    toggleCardSelectionMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("still removes a played card and keeps the rest clickable when the backend resends an identical hand before the leave animation finishes", () => {
    const full = [parseCard("3S"), parseCard("4S"), parseCard("5S")];
    const afterPlay = [parseCard("4S"), parseCard("5S")];

    const { rerender } = render(<SelfHand hand={full} selectedCardIds={[]} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);

    // Card played: 3S leaves.
    rerender(<SelfHand hand={afterPlay} selectedCardIds={[]} />);

    // Backend resends the SAME hand (e.g. after an opponent's unrelated pass)
    // before the 200ms leave animation completes -- a fresh array reference,
    // identical content. This must not cancel the pending removal.
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(<SelfHand hand={[...afterPlay]} selectedCardIds={[]} />);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeEnabled();
    }
    expect(screen.queryByRole("button", { name: "3♠" })).not.toBeInTheDocument();
  });

  it("lets the remaining cards be clicked after a play, even after a redundant resend", () => {
    const full = [parseCard("3S"), parseCard("4S"), parseCard("5S")];
    const afterPlay = [parseCard("4S"), parseCard("5S")];

    const { rerender } = render(<SelfHand hand={full} selectedCardIds={[]} />);
    rerender(<SelfHand hand={afterPlay} selectedCardIds={[]} />);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(<SelfHand hand={[...afterPlay]} selectedCardIds={[]} />);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    const fourSpades = screen.getByRole("button", { name: "4♠" });
    fourSpades.click();
    expect(toggleCardSelectionMock).toHaveBeenCalledWith(parseCard("4S"));
  });
});

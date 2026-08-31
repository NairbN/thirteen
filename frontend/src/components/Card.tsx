import type { Card as CardId } from "@/lib/rules-engine/cards";
import { cardLabel } from "@/lib/cardDisplay";

interface CardProps {
  card: CardId;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const SIZE_CLASSES: Record<NonNullable<CardProps["size"]>, string> = {
  sm: "h-14 w-10 text-xs",
  md: "h-24 w-16 text-base",
};

export default function Card({ card, selected = false, onClick, size = "md" }: CardProps) {
  const { rank, glyph, isRed } = cardLabel(card);
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      aria-label={`${rank}${glyph}`}
      className={`flex flex-col items-center justify-between rounded-md border border-zinc-300 bg-white p-1 font-semibold shadow-sm transition-transform duration-150 ${SIZE_CLASSES[size]} ${isRed ? "text-rose-600" : "text-zinc-900"} ${selected ? "-translate-y-3 ring-2 ring-sky-500" : ""} ${interactive ? "cursor-pointer hover:-translate-y-1" : "cursor-default"}`}
    >
      <span className="self-start leading-none">{rank}</span>
      <span className="text-xl leading-none">{glyph}</span>
    </button>
  );
}

export function CardBack({ size = "md" }: { size?: CardProps["size"] }) {
  return (
    <div
      className={`rounded-md border border-zinc-400 bg-zinc-700 ${SIZE_CLASSES[size ?? "md"]}`}
      aria-hidden
    />
  );
}

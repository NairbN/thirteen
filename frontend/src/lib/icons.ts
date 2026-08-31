export const PLAYER_ICONS = [
  "🐯", "🐼", "🦊", "🐸", "🐵", "🐧", "🐙", "🦁", "🐺", "🐰", "🐨", "🐷",
] as const;

export type PlayerIcon = (typeof PLAYER_ICONS)[number];

export const DEFAULT_ICON: PlayerIcon = PLAYER_ICONS[0];

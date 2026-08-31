// Shared cartoony "sticker button" look: thick dark outline, offset flat
// shadow that collapses on press for a bouncy tactile feel. Centralized here
// so every screen's buttons (ActionBar, LobbyScreen, EndScreen,
// LandingScreen, RematchControls, ExitGameButton) read as one consistent
// game rather than each hand-rolling its own button chrome.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-ink font-display font-semibold tracking-wide transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:translate-y-0";

export const buttonVariants = {
  primary: `${BASE} bg-emerald-400 text-ink shadow-[0_4px_0_#2f9e44] hover:bg-emerald-300`,
  secondary: `${BASE} bg-sky-400 text-ink shadow-[0_4px_0_#1c7ed6] hover:bg-sky-300`,
  neutral: `${BASE} bg-amber-300 text-ink shadow-[0_4px_0_#e8990c] hover:bg-amber-200`,
  danger: `${BASE} bg-rose-400 text-white shadow-[0_4px_0_#c2255c] hover:bg-rose-300`,
  muted: `${BASE} bg-stone-200 text-ink shadow-[0_3px_0_#a8977f] hover:bg-stone-100`,
} as const;
export type ButtonVariant = keyof typeof buttonVariants;

export const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
} as const;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant, size: ButtonSize = "md"): string {
  return `${buttonVariants[variant]} ${buttonSizes[size]}`;
}

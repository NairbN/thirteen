export const ANIMAL_OPTIONS = ["bear", "cat", "fox", "panda", "tiger", "bunny"] as const;
export type AnimalOption = (typeof ANIMAL_OPTIONS)[number];

export const HAT_OPTIONS = ["none", "cap", "tophat", "bandana", "party"] as const;
export type HatOption = (typeof HAT_OPTIONS)[number];

export const GLASSES_OPTIONS = ["none", "round", "cool", "star", "heart"] as const;
export type GlassesOption = (typeof GLASSES_OPTIONS)[number];

export const SHIRT_OPTIONS = ["none", "red", "blue", "stripes", "hawaiian"] as const;
export type ShirtOption = (typeof SHIRT_OPTIONS)[number];

export interface AvatarConfig {
  animal: AnimalOption;
  hat: HatOption;
  glasses: GlassesOption;
  shirt: ShirtOption;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  animal: "bear",
  hat: "none",
  glasses: "none",
  shirt: "none",
};

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

export function isAvatarConfig(value: unknown): value is AvatarConfig {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isOneOf(ANIMAL_OPTIONS, candidate.animal) &&
    isOneOf(HAT_OPTIONS, candidate.hat) &&
    isOneOf(GLASSES_OPTIONS, candidate.glasses) &&
    isOneOf(SHIRT_OPTIONS, candidate.shirt)
  );
}

export function serializeAvatarConfig(config: AvatarConfig): string {
  return JSON.stringify(config);
}

// The `icon` wire field is an opaque string the server never parses (see
// v1_planning.md Socket Contract). Older sessions may still have a bare
// single-emoji string sitting in localStorage from before the avatar-builder
// existed, so any parse failure or shape mismatch here must fall back to a
// default rather than throw.
export function parseAvatarConfig(raw: string | null | undefined): AvatarConfig {
  if (!raw) return DEFAULT_AVATAR_CONFIG;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAvatarConfig(parsed) ? parsed : DEFAULT_AVATAR_CONFIG;
  } catch {
    return DEFAULT_AVATAR_CONFIG;
  }
}

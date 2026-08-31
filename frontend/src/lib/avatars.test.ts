import { describe, expect, it } from "vitest";
import {
  DEFAULT_AVATAR_CONFIG,
  parseAvatarConfig,
  serializeAvatarConfig,
  type AvatarConfig,
} from "./avatars";

describe("serializeAvatarConfig / parseAvatarConfig", () => {
  it("round-trips a valid config", () => {
    const config: AvatarConfig = { animal: "tiger", hat: "cap", glasses: "round", shirt: "red" };
    expect(parseAvatarConfig(serializeAvatarConfig(config))).toEqual(config);
  });

  it("round-trips every option in every slot", () => {
    const config: AvatarConfig = { animal: "bunny", hat: "party", glasses: "heart", shirt: "hawaiian" };
    expect(parseAvatarConfig(serializeAvatarConfig(config))).toEqual(config);
  });

  it("falls back to the default on a legacy single-emoji string", () => {
    expect(parseAvatarConfig("🐯")).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("falls back to the default on malformed JSON", () => {
    expect(parseAvatarConfig("{not valid json")).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("falls back to the default on well-formed JSON with the wrong shape", () => {
    expect(parseAvatarConfig(JSON.stringify({ foo: "bar" }))).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("falls back to the default when a field holds an option outside the known set", () => {
    expect(
      parseAvatarConfig(JSON.stringify({ animal: "dragon", hat: "none", glasses: "none", shirt: "none" })),
    ).toEqual(DEFAULT_AVATAR_CONFIG);
  });

  it("falls back to the default on null, empty, and non-object JSON", () => {
    expect(parseAvatarConfig(null)).toEqual(DEFAULT_AVATAR_CONFIG);
    expect(parseAvatarConfig("")).toEqual(DEFAULT_AVATAR_CONFIG);
    expect(parseAvatarConfig("42")).toEqual(DEFAULT_AVATAR_CONFIG);
    expect(parseAvatarConfig("null")).toEqual(DEFAULT_AVATAR_CONFIG);
  });
});

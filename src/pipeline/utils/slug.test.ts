import { describe, it, expect } from "vitest";
import { slugify, normalizePatternName, normalizeMaterialName } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Adams Dry Fly")).toBe("adams-dry-fly");
  });

  it("removes apostrophes", () => {
    expect(slugify("Hare's Ear")).toBe("hares-ear");
  });

  it("removes leading/trailing hyphens", () => {
    expect(slugify("  Adams  ")).toBe("adams");
  });

  it("collapses multiple special characters", () => {
    expect(slugify("Woolly---Bugger")).toBe("woolly-bugger");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("normalizePatternName", () => {
  it("strips 'fly pattern' suffix", () => {
    expect(normalizePatternName("Adams Fly Pattern")).toBe("adams");
  });

  it("strips 'fly' suffix", () => {
    expect(normalizePatternName("Adams Fly")).toBe("adams");
  });

  it("lowercases and trims", () => {
    expect(normalizePatternName("  Woolly Bugger  ")).toBe("woolly bugger");
  });

  it("collapses whitespace", () => {
    expect(normalizePatternName("Woolly   Bugger")).toBe("woolly bugger");
  });
});

describe("normalizeMaterialName", () => {
  it("lowercases and trims", () => {
    expect(normalizeMaterialName("  Mustad 94840  ")).toBe("mustad 94840");
  });

  it("strips size designations", () => {
    expect(normalizeMaterialName("Uni Thread Size 6/0")).toBe("uni thread");
  });

  it("lowercases material names with special characters", () => {
    const result = normalizeMaterialName("Hare's Ear Dubbing");
    expect(result).toBe("hare's ear dubbing");
  });
});

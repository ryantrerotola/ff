import { describe, it, expect } from "vitest";
import { calculateConfidence } from "./extractor";
import type { ExtractedPattern } from "../types";

function makePattern(overrides: Partial<ExtractedPattern> = {}): ExtractedPattern {
  return {
    patternName: "Adams Dry Fly",
    alternateNames: [],
    category: "dry",
    difficulty: "intermediate",
    waterType: "freshwater",
    description: "A classic dry fly pattern that imitates a wide range of mayflies. Extremely effective on trout streams.",
    origin: "Michigan, 1922",
    materials: [
      { name: "Mustad 94840", type: "hook", color: null, size: "12-18", required: true, position: 1 },
      { name: "Danville 6/0", type: "thread", color: "black", size: null, required: true, position: 2 },
      { name: "Grizzly hackle fibers", type: "tail", color: null, size: null, required: true, position: 3 },
      { name: "Adams gray dubbing", type: "body", color: "gray", size: null, required: true, position: 4 },
      { name: "Brown and grizzly", type: "hackle", color: "mixed", size: null, required: true, position: 5 },
      { name: "Grizzly hackle tips", type: "wing", color: null, size: null, required: true, position: 6 },
    ],
    variations: [{ name: "Parachute Adams", description: "Uses a parachute hackle", materialChanges: [] }],
    substitutions: [{ originalMaterial: "Grizzly hackle", substituteMaterial: "Dun hackle", substitutionType: "alternative", notes: "Works when grizzly unavailable" }],
    tyingSteps: [],
    ...overrides,
  };
}

describe("calculateConfidence", () => {
  it("returns high confidence for a complete pattern", () => {
    const pattern = makePattern();
    const confidence = calculateConfidence(pattern, "blog", 2000);
    expect(confidence).toBeGreaterThan(0.85);
  });

  it("returns lower confidence for patterns with few materials", () => {
    const sparse = makePattern({
      materials: [
        { name: "Hook", type: "hook", color: null, size: null, required: true, position: 1 },
      ],
    });
    const confidence = calculateConfidence(sparse, "blog", 2000);
    const fullConfidence = calculateConfidence(makePattern(), "blog", 2000);
    expect(confidence).toBeLessThan(fullConfidence);
  });

  it("penalizes patterns with no hook", () => {
    const noHook = makePattern({
      materials: [
        { name: "Thread", type: "thread", color: null, size: null, required: true, position: 1 },
        { name: "Dubbing", type: "body", color: null, size: null, required: true, position: 2 },
      ],
    });
    const confidence = calculateConfidence(noHook, "blog", 2000);
    expect(confidence).toBeLessThan(0.8);
  });

  it("gives higher confidence to blog sources with long content", () => {
    const pattern = makePattern();
    const longContent = calculateConfidence(pattern, "blog", 2000);
    const shortContent = calculateConfidence(pattern, "blog", 100);
    expect(longContent).toBeGreaterThan(shortContent);
  });

  it("rewards patterns with origin info", () => {
    const withOrigin = makePattern({ origin: "Michigan, 1922" });
    const withoutOrigin = makePattern({ origin: null });
    const confWithOrigin = calculateConfidence(withOrigin, "blog", 2000);
    const confWithoutOrigin = calculateConfidence(withoutOrigin, "blog", 2000);
    expect(confWithOrigin).toBeGreaterThan(confWithoutOrigin);
  });

  it("rewards patterns with variations and substitutions", () => {
    const full = makePattern();
    const noExtras = makePattern({ variations: [], substitutions: [] });
    const confFull = calculateConfidence(full, "blog", 2000);
    const confNoExtras = calculateConfidence(noExtras, "blog", 2000);
    expect(confFull).toBeGreaterThan(confNoExtras);
  });

  it("returns value between 0 and 1", () => {
    const confidence = calculateConfidence(makePattern(), "blog", 2000);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("penalizes 'other' category", () => {
    const specific = makePattern({ category: "dry" });
    const other = makePattern({ category: "other" });
    expect(calculateConfidence(specific, "blog", 2000)).toBeGreaterThan(
      calculateConfidence(other, "blog", 2000)
    );
  });
});

import { describe, it, expect } from "vitest";
import { buildConsensus } from "./consensus";
import type { ExtractedPattern } from "../types";

function makeExtraction(overrides: Partial<ExtractedPattern> = {}): ExtractedPattern {
  return {
    patternName: "Woolly Bugger",
    alternateNames: [],
    category: "streamer",
    difficulty: "beginner",
    waterType: "freshwater",
    description: "A versatile streamer pattern.",
    origin: null,
    materials: [
      { name: "Mustad 9672", type: "hook", color: null, size: "6-10", required: true, position: 1 },
      { name: "6/0 Thread", type: "thread", color: "black", size: null, required: true, position: 2 },
      { name: "Marabou", type: "tail", color: "black", size: null, required: true, position: 3 },
      { name: "Chenille", type: "body", color: "black", size: null, required: true, position: 4 },
      { name: "Saddle hackle", type: "hackle", color: "grizzly", size: null, required: true, position: 5 },
    ],
    variations: [],
    substitutions: [],
    ...overrides,
  };
}

describe("buildConsensus", () => {
  it("throws for empty extractions", () => {
    expect(() => buildConsensus([])).toThrow("Cannot build consensus from empty extractions");
  });

  it("builds consensus from a single source", () => {
    const result = buildConsensus([makeExtraction()]);
    expect(result.patternName).toBe("Woolly Bugger");
    expect(result.slug).toBe("woolly-bugger");
    expect(result.category.value).toBe("streamer");
    expect(result.sourceCount).toBe(1);
    expect(result.materials.length).toBeGreaterThan(0);
  });

  it("picks the most common pattern name across sources", () => {
    const result = buildConsensus([
      makeExtraction({ patternName: "Woolly Bugger" }),
      makeExtraction({ patternName: "Woolly Bugger" }),
      makeExtraction({ patternName: "Wooly Bugger" }),
    ]);
    expect(result.patternName).toBe("Woolly Bugger");
  });

  it("uses majority vote for category", () => {
    const result = buildConsensus([
      makeExtraction({ category: "streamer" }),
      makeExtraction({ category: "streamer" }),
      makeExtraction({ category: "nymph" }),
    ]);
    expect(result.category.value).toBe("streamer");
    expect(result.category.confidence).toBeCloseTo(2 / 3, 2);
  });

  it("increases confidence with more agreeing sources", () => {
    const twoSources = buildConsensus([
      makeExtraction(),
      makeExtraction(),
    ]);
    const fourSources = buildConsensus([
      makeExtraction(),
      makeExtraction(),
      makeExtraction(),
      makeExtraction(),
    ]);
    expect(fourSources.overallConfidence).toBeGreaterThanOrEqual(twoSources.overallConfidence);
  });

  it("preserves material positions in order", () => {
    const result = buildConsensus([makeExtraction()]);
    const positions = result.materials.map((m) => m.position);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
    }
  });

  it("deduplicates variations by name", () => {
    const result = buildConsensus([
      makeExtraction({
        variations: [
          { name: "Olive Woolly Bugger", description: "Olive version", materialChanges: [] },
        ],
      }),
      makeExtraction({
        variations: [
          { name: "Olive Woolly Bugger", description: "Same fly in olive color with longer description", materialChanges: [] },
        ],
      }),
    ]);
    // Should have one variation (deduplicated), keeping the longer description
    expect(result.variations.length).toBe(1);
    expect(result.variations[0]!.description.length).toBeGreaterThan(10);
  });

  it("deduplicates substitutions", () => {
    const sub = {
      originalMaterial: "Marabou",
      substituteMaterial: "Arctic Fox",
      substitutionType: "alternative",
      notes: "Similar movement",
    };
    const result = buildConsensus([
      makeExtraction({ substitutions: [sub] }),
      makeExtraction({ substitutions: [sub] }),
    ]);
    expect(result.substitutions.length).toBe(1);
  });

  it("picks the longest, best description", () => {
    const result = buildConsensus([
      makeExtraction({ description: "Short." }),
      makeExtraction({ description: "A versatile streamer that imitates leeches, baitfish, and other aquatic creatures. Effective for trout and bass." }),
    ]);
    expect(result.description.length).toBeGreaterThan(20);
  });

  it("overall confidence is between 0 and 1", () => {
    const result = buildConsensus([makeExtraction(), makeExtraction()]);
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(1);
  });
});

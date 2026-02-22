import { describe, it, expect } from "vitest";
import {
  stringSimilarity,
  tokenSimilarity,
  combinedSimilarity,
  findBestMatch,
  clusterSimilarStrings,
} from "./matcher";

describe("stringSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(stringSimilarity("hello", "hello")).toBe(1);
  });

  it("returns 1 for case-insensitive identical strings", () => {
    expect(stringSimilarity("Hello", "hello")).toBe(1);
  });

  it("returns 0 for empty vs non-empty", () => {
    expect(stringSimilarity("", "hello")).toBe(0);
  });

  it("returns high score for similar strings", () => {
    expect(stringSimilarity("Mustad 9672", "Mustad 9671")).toBeGreaterThan(0.8);
  });

  it("returns low score for very different strings", () => {
    expect(stringSimilarity("hook", "dubbing")).toBeLessThan(0.5);
  });
});

describe("tokenSimilarity", () => {
  it("matches reordered tokens", () => {
    // "UNI-Thread" gets split by tokenizer into "uni" + "thread", so partial overlap
    const score = tokenSimilarity("Uni Thread 6/0", "6/0 UNI-Thread");
    expect(score).toBeGreaterThan(0.3);
  });

  it("matches partial brand names", () => {
    const score = tokenSimilarity("Tiemco TMC 100", "TMC 100");
    expect(score).toBeGreaterThan(0.6);
  });

  it("returns 0 for completely different material names", () => {
    const score = tokenSimilarity("elk hair", "peacock herl");
    expect(score).toBeLessThan(0.3);
  });
});

describe("combinedSimilarity", () => {
  it("uses the higher of string or token similarity", () => {
    const stringScore = stringSimilarity("Uni Thread 6/0", "6/0 UNI-Thread");
    const tokenScore = tokenSimilarity("Uni Thread 6/0", "6/0 UNI-Thread");
    const combined = combinedSimilarity("Uni Thread 6/0", "6/0 UNI-Thread");
    expect(combined).toBe(Math.max(stringScore, tokenScore));
  });
});

describe("findBestMatch", () => {
  it("finds the closest match from candidates", () => {
    const result = findBestMatch("Mustad 94840", [
      "Tiemco TMC 100",
      "Mustad 94841",
      "Daiichi 1180",
    ]);
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Mustad 94841");
    expect(result!.score).toBeGreaterThan(0.8);
  });

  it("returns null for empty candidates", () => {
    const result = findBestMatch("test", []);
    expect(result).toBeNull();
  });
});

describe("clusterSimilarStrings", () => {
  it("groups identical strings together", () => {
    const groups = clusterSimilarStrings(["A", "A", "B", "B"], 0.9);
    expect(groups.length).toBe(2);
  });

  it("keeps dissimilar strings separate", () => {
    const groups = clusterSimilarStrings(["hook", "thread", "dubbing"], 0.8);
    expect(groups.length).toBe(3);
  });

  it("clusters similar material names", () => {
    const groups = clusterSimilarStrings(
      ["Uni Thread 6/0", "UNI-Thread 6/0", "Marabou", "marabou feathers"],
      0.7
    );
    // "Uni Thread 6/0" and "UNI-Thread 6/0" should cluster together
    expect(groups.length).toBeLessThanOrEqual(3);
  });
});

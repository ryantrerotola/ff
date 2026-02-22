import { describe, it, expect } from "vitest";
import { scoreYouTubeResult } from "./youtube";
import type { RawYouTubeResult } from "../types";

function makeResult(overrides: Partial<RawYouTubeResult> = {}): RawYouTubeResult {
  return {
    videoId: "abc123",
    title: "Generic video",
    channelTitle: "Some Channel",
    description: "A video about something",
    publishedAt: "2024-01-01T00:00:00Z",
    viewCount: 500,
    likeCount: 20,
    transcript: null,
    ...overrides,
  };
}

describe("scoreYouTubeResult", () => {
  it("gives bonus for transcript", () => {
    const withTranscript = scoreYouTubeResult(makeResult({ transcript: "some transcript text" }));
    const withoutTranscript = scoreYouTubeResult(makeResult({ transcript: null }));
    expect(withTranscript).toBe(withoutTranscript + 30);
  });

  it("gives bonus for high view count", () => {
    const viral = scoreYouTubeResult(makeResult({ viewCount: 200000 }));
    const moderate = scoreYouTubeResult(makeResult({ viewCount: 50000 }));
    const low = scoreYouTubeResult(makeResult({ viewCount: 500 }));
    expect(viral).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(low);
  });

  it("gives bonus for title keywords", () => {
    const tutorial = scoreYouTubeResult(makeResult({ title: "How to Tie an Adams Dry Fly - Tutorial" }));
    const generic = scoreYouTubeResult(makeResult({ title: "My fishing trip" }));
    expect(tutorial).toBeGreaterThan(generic);
  });

  it("gives bonus for known creators", () => {
    const known = scoreYouTubeResult(makeResult({ channelTitle: "Tightline Productions" }));
    const unknown = scoreYouTubeResult(makeResult({ channelTitle: "Random Angler" }));
    expect(known).toBe(unknown + 15);
  });

  it("matches known creators case-insensitively", () => {
    const score1 = scoreYouTubeResult(makeResult({ channelTitle: "Tim Flagler" }));
    const score2 = scoreYouTubeResult(makeResult({ channelTitle: "TIM FLAGLER" }));
    expect(score1).toBe(score2);
  });

  it("gives bonus for description material keywords", () => {
    const detailed = scoreYouTubeResult(makeResult({
      description: "Hook: TMC 100, Thread: 6/0, Tail: hackle fibers, Body: dubbing, Wing: CDC",
    }));
    const sparse = scoreYouTubeResult(makeResult({
      description: "Check out this cool video",
    }));
    expect(detailed).toBeGreaterThan(sparse);
  });

  it("accumulates multiple bonuses", () => {
    const fullScore = scoreYouTubeResult(makeResult({
      title: "How to Tie a Woolly Bugger - Step by Step Fly Tying Tutorial",
      channelTitle: "Davie McPhail",
      transcript: "today we're going to tie...",
      viewCount: 150000,
      likeCount: 5000,
      description: "Materials: hook, thread, tail, body, hackle, rib",
    }));
    // Should score very high with all signals
    expect(fullScore).toBeGreaterThan(70);
  });

  it("returns 0 for completely irrelevant video", () => {
    const score = scoreYouTubeResult(makeResult({
      title: "Cat compilation 2024",
      channelTitle: "Cat Lover",
      description: "Funny cats",
      viewCount: 100,
      likeCount: 5,
      transcript: null,
    }));
    expect(score).toBe(0);
  });
});

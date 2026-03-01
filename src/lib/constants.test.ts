import { describe, expect, it } from "vitest";
import { resolveAppUrl } from "./constants";

describe("resolveAppUrl", () => {
  it("returns NEXT_PUBLIC_APP_URL origin when it already includes protocol", () => {
    expect(resolveAppUrl("https://flyarchive.vercel.app/path", undefined)).toBe(
      "https://flyarchive.vercel.app",
    );
  });

  it("adds https protocol when missing", () => {
    expect(resolveAppUrl("flyarchive.vercel.app", undefined)).toBe(
      "https://flyarchive.vercel.app",
    );
  });

  it("falls back to VERCEL_URL when NEXT_PUBLIC_APP_URL is unset", () => {
    expect(resolveAppUrl(undefined, "flyarchive-git-main.vercel.app")).toBe(
      "https://flyarchive-git-main.vercel.app",
    );
  });

  it("falls back to localhost when value is invalid", () => {
    expect(resolveAppUrl("http://", undefined)).toBe("http://localhost:3000");
  });
});

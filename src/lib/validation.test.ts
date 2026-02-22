import { describe, it, expect } from "vitest";
import { paginationSchema, patternSearchSchema, registerSchema } from "./validation";

describe("paginationSchema", () => {
  it("accepts valid page and limit", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it("applies defaults when params are missing", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects page 0", () => {
    const result = paginationSchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = paginationSchema.safeParse({ page: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 50", () => {
    const result = paginationSchema.safeParse({ limit: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects NaN values", () => {
    const result = paginationSchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });

  it("coerces numeric strings to numbers", () => {
    const result = paginationSchema.safeParse({ page: "5", limit: "25" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(25);
    }
  });

  it("rejects floating point page numbers", () => {
    const result = paginationSchema.safeParse({ page: "1.5" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      username: "fisher42",
      email: "fisher@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects username with spaces", () => {
    const result = registerSchema.safeParse({
      username: "fisher man",
      email: "fisher@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      username: "fisher42",
      email: "fisher@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      username: "fisher42",
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });

  it("allows hyphens and underscores in username", () => {
    const result = registerSchema.safeParse({
      username: "fly-tying_pro",
      email: "pro@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });
});

describe("patternSearchSchema", () => {
  it("accepts empty query with defaults", () => {
    const result = patternSearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(12);
    }
  });

  it("rejects invalid category", () => {
    const result = patternSearchSchema.safeParse({ category: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts valid category filter", () => {
    const result = patternSearchSchema.safeParse({ category: "dry" });
    expect(result.success).toBe(true);
  });
});

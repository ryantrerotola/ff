import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./prisma";

describe("resolveDatabaseUrl", () => {
  it("accepts postgresql URL values", () => {
    expect(resolveDatabaseUrl("postgresql://user:pass@localhost:5432/postgres")).toBe(
      "postgresql://user:pass@localhost:5432/postgres",
    );
  });

  it("trims whitespace and strips surrounding double quotes", () => {
    expect(
      resolveDatabaseUrl(
        '  "postgresql://user:pass@db.example.com:5432/postgres?schema=public"  ',
      ),
    ).toBe("postgresql://user:pass@db.example.com:5432/postgres?schema=public");
  });

  it("trims whitespace and strips surrounding single quotes", () => {
    expect(
      resolveDatabaseUrl(
        "  'postgres://user:pass@db.example.com:5432/postgres?schema=public'  ",
      ),
    ).toBe("postgres://user:pass@db.example.com:5432/postgres?schema=public");
  });

  it("returns undefined for non-postgres URL values", () => {
    expect(resolveDatabaseUrl("db.example.com:5432/postgres")).toBeUndefined();
  });
});

import { describe, expect, it, vi } from "vitest";
import { isRetryablePrismaError, withDatabaseRetry } from "./prisma-errors";

describe("isRetryablePrismaError", () => {
  it("returns true for transient connectivity errors", () => {
    expect(
      isRetryablePrismaError(
        new Error("Can't reach database server at db.example:5432")
      )
    ).toBe(true);
  });

  it("returns false for non-errors", () => {
    expect(isRetryablePrismaError("nope")).toBe(false);
  });
});

describe("withDatabaseRetry", () => {
  it("retries transient failures and succeeds", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("Can't reach database server"))
      .mockResolvedValueOnce("ok");

    await expect(
      withDatabaseRetry(operation, { attempts: 3, delayMs: 1 })
    ).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient failures", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("relation does not exist"));

    await expect(
      withDatabaseRetry(operation, { attempts: 3, delayMs: 1 })
    ).rejects.toThrow("relation does not exist");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Retry a database operation with exponential backoff.
 *
 * This exists as a safety net for Vercel serverless cold starts where
 * the very first connection attempt to Supabase may time out.
 *
 * With proper Supabase pooler config (?pgbouncer=true&connection_limit=1)
 * this should rarely be needed — but it prevents user-visible errors
 * on the occasional cold start that exceeds the connect timeout.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;

      // Only retry on connection/timeout errors, not on query logic errors
      const message = error instanceof Error ? error.message : "";
      const isRetryable =
        message.includes("connect") ||
        message.includes("timeout") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ECONNRESET") ||
        message.includes("prepared statement") ||
        message.includes("Connection pool") ||
        message.includes("Can't reach database");

      if (!isRetryable) throw error;

      const wait = delayMs * Math.pow(2, attempt);
      console.warn(
        `[prisma] Attempt ${attempt + 1}/${retries + 1} failed (${message.slice(0, 80)}), retrying in ${wait}ms...`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("withRetry: unreachable");
}

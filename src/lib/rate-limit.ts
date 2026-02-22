import { prisma } from "./prisma";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

/**
 * Database-backed rate limiter. Persists across deploys and server restarts.
 * Uses a sliding window: each key tracks attempts within the last 15 minutes.
 */
export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);

  // Upsert: create or increment attempts for this key
  const record = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, attempts: 1, expiresAt },
    update: { attempts: { increment: 1 } },
  });

  // If the window has expired, reset the counter
  if (record.expiresAt < now) {
    await prisma.rateLimit.update({
      where: { key },
      data: { attempts: 1, expiresAt },
    });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.attempts > MAX_ATTEMPTS) {
    const retryAfterMs = Math.max(0, record.expiresAt.getTime() - now.getTime());
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

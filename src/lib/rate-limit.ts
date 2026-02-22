const hits = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const attempts = (hits.get(key) ?? []).filter((t) => t > windowStart);
  hits.set(key, attempts);

  if (attempts.length >= MAX_ATTEMPTS) {
    const oldest = attempts[0]!;
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now };
  }

  attempts.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

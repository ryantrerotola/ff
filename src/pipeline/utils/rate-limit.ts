export function createRateLimiter(delayMs: number) {
  let lastCall = 0;

  return async function rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed < delayMs) {
      await sleep(delayMs - elapsed);
    }
    lastCall = Date.now();
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; backoffMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000, label = "operation" } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const delay = backoffMs * Math.pow(2, attempt);
      console.log(
        `[RETRY] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  throw new Error("Unreachable");
}

/**
 * Process items with bounded concurrency.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index];
      if (item !== undefined) {
        results[index] = await fn(item, index);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);

  return results;
}

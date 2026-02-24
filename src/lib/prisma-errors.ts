const RETRYABLE_MESSAGE_PATTERNS = [
  "can't reach database server",
  "timed out",
  "too many database connections",
  "connection",
];

export function isRetryablePrismaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 150;

  let attempt = 0;
  let lastError: unknown;

  while (attempt < attempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (!isRetryablePrismaError(error) || attempt >= attempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

import { PrismaClient } from "@prisma/client";

export function resolveDatabaseUrl(rawValue: string | undefined): string | undefined {
  const trimmed = rawValue?.trim();

  if (!trimmed) {
    return undefined;
  }

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  if (!unquoted) {
    return undefined;
  }

  return /^(postgresql|postgres):\/\//i.test(unquoted) ? unquoted : undefined;
}

const resolvedDatabaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

if (resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
} else if (process.env.DATABASE_URL) {
  console.error(
    "[Prisma] DATABASE_URL is set but invalid. Expected a postgres:// or postgresql:// URL. Check for surrounding quotes/whitespace in your environment variable.",
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl(process.env.DATABASE_URL));
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

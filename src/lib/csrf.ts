import { NextResponse } from "next/server";

/**
 * Validates that a mutation request came from the same origin.
 * SameSite=Lax cookies already prevent most CSRF, but checking
 * Origin/Referer adds defense in depth.
 */
export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Allow requests with no origin (same-origin form submits, server-side)
  if (!origin) return null;

  try {
    const originHost = new URL(origin).host;
    if (host && originHost === host) return null;
  } catch {
    // Invalid origin URL
  }

  return NextResponse.json(
    { error: "Invalid request origin" },
    { status: 403 },
  );
}

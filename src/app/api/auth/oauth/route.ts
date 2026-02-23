import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isGoogleConfigured,
  isGitHubConfigured,
  getGoogleAuthUrl,
  getGitHubAuthUrl,
} from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");

  if (!provider) {
    // Return available providers
    return NextResponse.json({
      google: isGoogleConfigured(),
      github: isGitHubConfigured(),
    });
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  if (provider === "google" && isGoogleConfigured()) {
    return NextResponse.redirect(getGoogleAuthUrl(state));
  }

  if (provider === "github" && isGitHubConfigured()) {
    return NextResponse.redirect(getGitHubAuthUrl(state));
  }

  return NextResponse.json(
    { error: "Provider not available" },
    { status: 400 },
  );
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleTokens, getGoogleUserInfo } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { APP_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_params`);
  }

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_state`);
  }

  try {
    const tokens = await getGoogleTokens(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Check if OAuth account exists
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "google",
          providerUserId: userInfo.sub,
        },
      },
      include: { user: true },
    });

    if (oauthAccount) {
      // Existing user — create session
      await createSession(oauthAccount.userId);
      return NextResponse.redirect(`${APP_URL}/`);
    }

    // Check if user with same email exists
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (user) {
      // Link OAuth account to existing user
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "google",
          providerUserId: userInfo.sub,
          email: userInfo.email,
          displayName: userInfo.name,
          avatarUrl: userInfo.picture,
        },
      });
      await createSession(user.id);
      return NextResponse.redirect(`${APP_URL}/`);
    }

    // Create new user
    const username = generateUsername(userInfo.email, userInfo.name);
    user = await prisma.user.create({
      data: {
        username,
        email: userInfo.email,
        passwordHash: "", // OAuth users don't have passwords
        displayName: userInfo.name,
        avatarUrl: userInfo.picture,
        emailVerified: userInfo.email_verified,
      },
    });

    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: "google",
        providerUserId: userInfo.sub,
        email: userInfo.email,
        displayName: userInfo.name,
        avatarUrl: userInfo.picture,
      },
    });

    await createSession(user.id);
    return NextResponse.redirect(`${APP_URL}/`);
  } catch (err) {
    console.error("[Google OAuth] Error:", err);
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_error`);
  }
}

function generateUsername(email: string, name: string): string {
  // Try email prefix first, then name-based
  const base = (email.split("@")[0] ?? name.replace(/\s+/g, ""))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 25);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGitHubAccessToken, getGitHubUser, getGitHubEmail } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { APP_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_params`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_state`);
  }

  try {
    const accessToken = await getGitHubAccessToken(code);
    const githubUser = await getGitHubUser(accessToken);
    const email = githubUser.email ?? (await getGitHubEmail(accessToken));

    if (!email) {
      return NextResponse.redirect(`${APP_URL}/login?error=no_email`);
    }

    const providerUserId = String(githubUser.id);

    // Check if OAuth account exists
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "github",
          providerUserId,
        },
      },
      include: { user: true },
    });

    if (oauthAccount) {
      await createSession(oauthAccount.userId);
      return NextResponse.redirect(`${APP_URL}/`);
    }

    // Check if user with same email exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "github",
          providerUserId,
          email,
          displayName: githubUser.name,
          avatarUrl: githubUser.avatar_url,
        },
      });
      await createSession(user.id);
      return NextResponse.redirect(`${APP_URL}/`);
    }

    // Create new user
    const username = await generateUniqueUsername(githubUser.login);
    user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: "",
        displayName: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        emailVerified: true,
      },
    });

    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: "github",
        providerUserId,
        email,
        displayName: githubUser.name,
        avatarUrl: githubUser.avatar_url,
      },
    });

    await createSession(user.id);
    return NextResponse.redirect(`${APP_URL}/`);
  } catch (err) {
    console.error("[GitHub OAuth] Error:", err);
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_error`);
  }
}

async function generateUniqueUsername(base: string): Promise<string> {
  const clean = base.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 25);
  const existing = await prisma.user.findUnique({
    where: { username: clean },
  });
  if (!existing) return clean;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${clean}_${suffix}`;
}

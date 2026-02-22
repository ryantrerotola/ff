import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(`forgot-password:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Always return 200 to prevent email enumeration
    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  }

  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  // In production this token would be emailed, not returned in the response
  return NextResponse.json({
    message: "If an account with that email exists, a reset link has been sent.",
    resetToken: token,
  });
}

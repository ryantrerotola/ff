import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = await checkRateLimit(`reset-password:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    if (resetToken) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    }
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // Delete the used reset token
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  // Delete all user sessions to force re-login
  await prisma.session.deleteMany({ where: { userId: resetToken.userId } });

  return NextResponse.json({
    message: "Password has been reset successfully. Please log in.",
  });
}

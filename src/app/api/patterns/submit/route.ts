import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { submitPatternSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const submissions = await prisma.userSubmittedPattern.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = submitPatternSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, category, difficulty, waterType, description, materials } =
    parsed.data;

  const submission = await prisma.userSubmittedPattern.create({
    data: {
      userId: user.id,
      name,
      category,
      difficulty,
      waterType,
      description,
      materials: materials as unknown as object,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}

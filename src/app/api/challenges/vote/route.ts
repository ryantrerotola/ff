import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { entryId } = await request.json();

  if (!entryId?.trim()) {
    return NextResponse.json(
      { error: "entryId is required" },
      { status: 400 },
    );
  }

  const entry = await prisma.challengeEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (entry.userId === user.id) {
    return NextResponse.json(
      { error: "You cannot vote for your own entry" },
      { status: 400 },
    );
  }

  const updated = await prisma.challengeEntry.update({
    where: { id: entryId },
    data: { votes: { increment: 1 } },
  });

  return NextResponse.json({ votes: updated.votes });
}

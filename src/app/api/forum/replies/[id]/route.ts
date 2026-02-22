import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const reply = await prisma.forumReply.findUnique({ where: { id } });
  if (!reply) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reply.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const updated = await prisma.forumReply.update({
    where: { id },
    data: { content: content.slice(0, 5000), editedAt: new Date() },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const reply = await prisma.forumReply.findUnique({ where: { id } });
  if (!reply) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (reply.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.forumReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

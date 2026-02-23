import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const moderationActionSchema = z.object({
  action: z.enum(["delete", "approve-submission", "reject-submission"]),
  targetType: z.enum(["comment", "forumPost", "forumReply", "newsComment", "submission"]),
  targetId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "all";

  const [
    recentComments,
    recentForumPosts,
    recentForumReplies,
    pendingSubmissions,
    userCount,
  ] = await Promise.all([
    type === "all" || type === "comments"
      ? prisma.comment.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            flyPattern: { select: { name: true, slug: true } },
          },
        })
      : [],
    type === "all" || type === "forum"
      ? prisma.forumPost.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            _count: { select: { replies: true } },
          },
        })
      : [],
    type === "all" || type === "forum"
      ? prisma.forumReply.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, role: true } },
            post: { select: { id: true, title: true } },
          },
        })
      : [],
    prisma.userSubmittedPattern.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    recentComments,
    recentForumPosts,
    recentForumReplies,
    pendingSubmissions,
    userCount,
  });
}

// Admin actions: delete content, approve/reject submissions
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = moderationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { action, targetType, targetId } = parsed.data;

  try {
    switch (action) {
      case "delete": {
        if (targetType === "comment") {
          await prisma.comment.delete({ where: { id: targetId } });
        } else if (targetType === "forumPost") {
          await prisma.forumPost.delete({ where: { id: targetId } });
        } else if (targetType === "forumReply") {
          await prisma.forumReply.delete({ where: { id: targetId } });
        } else if (targetType === "newsComment") {
          await prisma.newsComment.delete({ where: { id: targetId } });
        }
        return NextResponse.json({ ok: true });
      }
      case "approve-submission": {
        const submission = await prisma.userSubmittedPattern.update({
          where: { id: targetId },
          data: { status: "approved" },
        });

        // Promote to the main FlyPattern table so it shows up publicly
        const slug = submission.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Ensure slug uniqueness
        const existing = await prisma.flyPattern.findUnique({ where: { slug } });
        const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

        const flyPattern = await prisma.flyPattern.create({
          data: {
            name: submission.name,
            slug: finalSlug,
            category: submission.category,
            difficulty: submission.difficulty,
            waterType: submission.waterType,
            description: submission.description,
          },
        });

        // Link submitted materials to the pattern if they exist
        const materialsJson = submission.materials as
          | { type: string; name: string; color?: string; size?: string }[]
          | null;
        if (Array.isArray(materialsJson)) {
          for (let i = 0; i < materialsJson.length; i++) {
            const mat = materialsJson[i]!;
            // Find or create the material
            let material = await prisma.material.findFirst({
              where: { name: mat.name },
            });
            if (!material) {
              const materialType = (mat.type ?? "other") as import("@prisma/client").MaterialType;
              material = await prisma.material.create({
                data: {
                  name: mat.name,
                  type: materialType,
                },
              });
            }
            await prisma.flyPatternMaterial.create({
              data: {
                flyPatternId: flyPattern.id,
                materialId: material.id,
                required: true,
                position: i + 1,
              },
            });
          }
        }

        return NextResponse.json({ ok: true, flyPatternId: flyPattern.id });
      }
      case "reject-submission": {
        await prisma.userSubmittedPattern.update({
          where: { id: targetId },
          data: { status: "rejected" },
        });
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    const message = String(err);
    if (message.includes("Record to update not found") || message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { directMessageSchema } from "@/lib/validation";

// GET /api/messages - list conversations
// GET /api/messages?userId=xxx - get messages with a specific user
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const otherUserId = request.nextUrl.searchParams.get("userId");

  if (otherUserId) {
    // Get messages between current user and otherUserId
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id },
        ],
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages from the other user as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  }

  // Get conversation list (most recent message from each conversation partner)
  const conversations = await prisma.$queryRaw<
    {
      partner_id: string;
      partner_username: string;
      partner_display_name: string | null;
      last_message: string;
      last_message_at: Date;
      unread_count: bigint;
    }[]
  >`
    SELECT
      partner.id AS partner_id,
      partner.username AS partner_username,
      partner.display_name AS partner_display_name,
      last_msg.content AS last_message,
      last_msg.created_at AS last_message_at,
      COALESCE(unread.cnt, 0) AS unread_count
    FROM (
      SELECT DISTINCT
        CASE
          WHEN sender_id = ${user.id}::uuid THEN receiver_id
          ELSE sender_id
        END AS partner_id
      FROM direct_messages
      WHERE sender_id = ${user.id}::uuid OR receiver_id = ${user.id}::uuid
    ) AS partners
    JOIN users AS partner ON partner.id = partners.partner_id
    JOIN LATERAL (
      SELECT content, created_at
      FROM direct_messages
      WHERE (sender_id = ${user.id}::uuid AND receiver_id = partners.partner_id)
         OR (sender_id = partners.partner_id AND receiver_id = ${user.id}::uuid)
      ORDER BY created_at DESC
      LIMIT 1
    ) AS last_msg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS cnt
      FROM direct_messages
      WHERE sender_id = partners.partner_id
        AND receiver_id = ${user.id}::uuid
        AND read = false
    ) AS unread ON true
    ORDER BY last_msg.created_at DESC
  `;

  return NextResponse.json(
    conversations.map((c) => ({
      partnerId: c.partner_id,
      partnerUsername: c.partner_username,
      partnerDisplayName: c.partner_display_name,
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      unreadCount: Number(c.unread_count),
    })),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = directMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  if (parsed.data.receiverId === user.id) {
    return NextResponse.json(
      { error: "Cannot message yourself" },
      { status: 400 },
    );
  }

  const receiver = await prisma.user.findUnique({
    where: { id: parsed.data.receiverId },
  });

  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId: user.id,
      receiverId: parsed.data.receiverId,
      content: parsed.data.content,
    },
    include: {
      sender: {
        select: { id: true, username: true, displayName: true },
      },
      receiver: {
        select: { id: true, username: true, displayName: true },
      },
    },
  });

  return NextResponse.json(message, { status: 201 });
}

import { prisma } from "./prisma";

type NotificationType =
  | "comment_reply"
  | "forum_reply"
  | "message"
  | "like"
  | "follow"
  | "pattern_approved"
  | "pattern_rejected";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  await prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}

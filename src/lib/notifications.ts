import { prisma } from "./prisma";
import {
  sendForumReplyEmail,
  sendMessageEmail,
  sendPatternApprovedEmail,
} from "./email";

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

  // Send email notification (non-blocking)
  sendEmailForNotification(userId, type, title, body, link).catch((err) =>
    console.error("[Notification Email] Error:", err),
  );
}

async function sendEmailForNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return;

  switch (type) {
    case "forum_reply":
      await sendForumReplyEmail(user.email, title, body, link ?? "");
      break;
    case "message":
      await sendMessageEmail(user.email, title, body);
      break;
    case "pattern_approved":
      await sendPatternApprovedEmail(user.email, title, link ?? "");
      break;
    default:
      // Other notification types don't send email by default
      break;
  }
}

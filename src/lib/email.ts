import nodemailer from "nodemailer";
import { APP_NAME, APP_URL } from "./constants";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM ?? `${APP_NAME} <noreply@flypatterndb.com>`;

function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(
      `[Email] SMTP not configured. Would send to ${options.to}: ${options.subject}`,
    );
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

// ─── Pre-built notification templates ────────────────────────────────────────

export async function sendForumReplyEmail(
  to: string,
  postTitle: string,
  replierName: string,
  postId: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New reply to "${postTitle}" — ${APP_NAME}`,
    text: `${replierName} replied to your forum post "${postTitle}".\n\nView it at: ${APP_URL}/forum/${postId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b6e57;">${APP_NAME}</h2>
        <p><strong>${replierName}</strong> replied to your forum post "<strong>${postTitle}</strong>".</p>
        <p><a href="${APP_URL}/forum/${postId}" style="display: inline-block; padding: 10px 20px; background: #2b6e57; color: white; text-decoration: none; border-radius: 6px;">View Reply</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">You received this email because someone replied to your post on ${APP_NAME}. Manage notifications in your <a href="${APP_URL}/settings">settings</a>.</p>
      </div>
    `,
  });
}

export async function sendMessageEmail(
  to: string,
  senderName: string,
  preview: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `New message from ${senderName} — ${APP_NAME}`,
    text: `${senderName} sent you a message: "${preview.slice(0, 100)}".\n\nView it at: ${APP_URL}/messages`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b6e57;">${APP_NAME}</h2>
        <p><strong>${senderName}</strong> sent you a message:</p>
        <blockquote style="border-left: 3px solid #2b6e57; padding-left: 12px; color: #4b5563;">${preview.slice(0, 200)}</blockquote>
        <p><a href="${APP_URL}/messages" style="display: inline-block; padding: 10px 20px; background: #2b6e57; color: white; text-decoration: none; border-radius: 6px;">View Message</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">You received this email because someone sent you a message on ${APP_NAME}. Manage notifications in your <a href="${APP_URL}/settings">settings</a>.</p>
      </div>
    `,
  });
}

export async function sendPatternApprovedEmail(
  to: string,
  patternName: string,
  patternSlug: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Your pattern "${patternName}" has been approved! — ${APP_NAME}`,
    text: `Great news! Your submitted pattern "${patternName}" has been approved and is now live.\n\nView it at: ${APP_URL}/patterns/${patternSlug}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b6e57;">${APP_NAME}</h2>
        <p>Great news! Your submitted pattern "<strong>${patternName}</strong>" has been approved and is now live.</p>
        <p><a href="${APP_URL}/patterns/${patternSlug}" style="display: inline-block; padding: 10px 20px; background: #2b6e57; color: white; text-decoration: none; border-radius: 6px;">View Pattern</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">You received this email because you submitted a pattern on ${APP_NAME}.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: `Reset your password — ${APP_NAME}`,
    text: `Reset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b6e57;">${APP_NAME}</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #2b6e57; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p style="font-size: 14px; color: #6b7280;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

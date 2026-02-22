import { z } from "zod";

export const patternSearchSchema = z.object({
  search: z.string().optional(),
  category: z
    .enum(["dry", "nymph", "streamer", "emerger", "saltwater", "other"])
    .optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  waterType: z.enum(["freshwater", "saltwater", "both"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(12),
});

export const feedbackSchema = z.object({
  flyPatternId: z.string().uuid(),
  helpful: z.boolean(),
  comment: z.string().min(1).max(1000),
});

// ─── Auth schemas ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ─── Community schemas ──────────────────────────────────────────────────────

export const commentSchema = z.object({
  flyPatternId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const forumPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export const forumReplySchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const directMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const submitPatternSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(["dry", "nymph", "streamer", "emerger", "saltwater", "other"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  waterType: z.enum(["freshwater", "saltwater", "both"]),
  description: z.string().min(1).max(5000),
  materials: z.array(
    z.object({
      type: z.enum([
        "hook",
        "thread",
        "tail",
        "body",
        "rib",
        "thorax",
        "wing",
        "hackle",
        "bead",
        "weight",
        "other",
      ]),
      name: z.string().min(1).max(200),
      color: z.string().max(100).optional(),
      size: z.string().max(100).optional(),
      required: z.boolean().optional().default(true),
    }),
  ),
});

// ─── Password reset schemas ────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8).max(128),
});

// ─── Content report schemas ────────────────────────────────────────────────

export const reportSchema = z.object({
  targetType: z.enum([
    "pattern",
    "comment",
    "forum_post",
    "forum_reply",
    "message",
    "news_comment",
  ]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "spam",
    "inappropriate",
    "incorrect_info",
    "copyright",
    "harassment",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

// ─── User settings schemas ────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const updateEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

// ─── Shared pagination schema ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export type PatternSearchInput = z.infer<typeof patternSearchSchema>;
export type FeedbackFormInput = z.infer<typeof feedbackSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ForumPostInput = z.infer<typeof forumPostSchema>;
export type ForumReplyInput = z.infer<typeof forumReplySchema>;
export type DirectMessageInput = z.infer<typeof directMessageSchema>;
export type SubmitPatternInput = z.infer<typeof submitPatternSchema>;

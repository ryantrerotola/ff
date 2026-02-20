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

export type PatternSearchInput = z.infer<typeof patternSearchSchema>;
export type FeedbackFormInput = z.infer<typeof feedbackSchema>;

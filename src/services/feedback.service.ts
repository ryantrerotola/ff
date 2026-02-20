import { prisma } from "@/lib/prisma";
import type { Feedback, FeedbackInput } from "@/lib/types";

export async function createFeedback(input: FeedbackInput): Promise<Feedback> {
  return prisma.feedback.create({
    data: {
      flyPatternId: input.flyPatternId,
      helpful: input.helpful,
      comment: input.comment,
    },
  });
}

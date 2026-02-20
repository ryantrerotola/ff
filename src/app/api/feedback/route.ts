import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/services/feedback.service";
import { feedbackSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const feedback = await createFeedback(parsed.data);
  return NextResponse.json(feedback, { status: 201 });
}

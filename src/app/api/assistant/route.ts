import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `assistant:${userId}`;
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { attempts: 1, expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
      create: { key, attempts: 1, expiresAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
    });
    return true;
  }

  if (existing.attempts >= RATE_LIMIT_MAX) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { attempts: { increment: 1 } },
  });

  return true;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message must be 2000 characters or less" },
      { status: 400 },
    );
  }

  const allowed = await checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 },
    );
  }

  // Search for relevant patterns based on the user's question
  const searchTerms = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 6);

  const patterns = await prisma.flyPattern.findMany({
    where: {
      OR: searchTerms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
      ]),
    },
    include: {
      materials: {
        include: {
          material: true,
        },
        orderBy: { position: "asc" as const },
      },
    },
    take: 10,
  });

  // If no search-matched patterns, grab a diverse sample
  let contextPatterns = patterns;
  if (contextPatterns.length === 0) {
    contextPatterns = await prisma.flyPattern.findMany({
      include: {
        materials: {
          include: { material: true },
          orderBy: { position: "asc" as const },
        },
      },
      take: 8,
      orderBy: { name: "asc" },
    });
  }

  const patternContext = contextPatterns
    .map((p) => {
      const materials = p.materials
        .map((m) => `${m.material.type}: ${m.material.name}${m.customColor ? ` (${m.customColor})` : ""}${m.customSize ? ` [${m.customSize}]` : ""}`)
        .join(", ");
      return `- ${p.name} (${p.category}, ${p.difficulty}, ${p.waterType}): ${p.description.slice(0, 200)}. Materials: ${materials}`;
    })
    .join("\n");

  const systemPrompt = `You are a knowledgeable fly fishing pattern assistant for FlyPatternDB. You help anglers find the right fly patterns, suggest materials and substitutes, answer tying questions, and share tips about fly fishing techniques.

You have access to the following fly patterns from the database:

${patternContext}

Guidelines:
- Be helpful, friendly, and concise
- When recommending patterns, reference specific ones from the database when relevant
- If asked about materials, provide practical suggestions and possible substitutes
- For tying questions, give clear step-by-step guidance
- If a question is outside your knowledge, say so honestly
- Keep responses focused on fly fishing, fly tying, and related topics
- Format responses with markdown when helpful (lists, bold, headers)`;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${errorMessage}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

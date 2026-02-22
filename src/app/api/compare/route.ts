import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slugsParam = searchParams.get("slugs");

  if (!slugsParam) {
    return NextResponse.json(
      { error: "Missing required 'slugs' query parameter" },
      { status: 400 }
    );
  }

  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length < 2 || slugs.length > 3) {
    return NextResponse.json(
      { error: "Provide 2 or 3 comma-separated slugs" },
      { status: 400 }
    );
  }

  const patterns = await prisma.flyPattern.findMany({
    where: { slug: { in: slugs } },
    include: {
      materials: {
        orderBy: { position: "asc" },
        include: {
          material: {
            include: {
              substitutionsFrom: {
                include: {
                  substituteMaterial: {
                    include: { affiliateLinks: true },
                  },
                },
              },
              affiliateLinks: true,
            },
          },
        },
      },
      variations: {
        include: {
          overrides: {
            include: {
              originalMaterial: true,
              replacementMaterial: true,
            },
          },
        },
      },
      resources: {
        orderBy: { qualityScore: "desc" },
      },
      feedback: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (patterns.length === 0) {
    return NextResponse.json(
      { error: "No patterns found for the given slugs" },
      { status: 404 }
    );
  }

  // Preserve the order requested by the user
  const ordered = slugs
    .map((slug) => patterns.find((p) => p.slug === slug))
    .filter(Boolean);

  return NextResponse.json(ordered);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { name: "General Discussion", slug: "general-discussion", description: "Talk about anything fly fishing related.", sortOrder: 1 },
  { name: "Pattern Requests", slug: "pattern-requests", description: "Request patterns or help identifying flies.", sortOrder: 2 },
  { name: "Tying Tips", slug: "tying-tips", description: "Share and discuss fly tying techniques.", sortOrder: 3 },
  { name: "Trip Reports", slug: "trip-reports", description: "Share your fishing trip stories.", sortOrder: 4 },
  { name: "Beginner Questions", slug: "beginner-questions", description: "New to fly tying? Ask anything here.", sortOrder: 5 },
  { name: "Gear Reviews", slug: "gear-reviews", description: "Review and discuss rods, reels, waders, vises, and other gear.", sortOrder: 6 },
];

let categoriesSeeded = false;

async function ensureDefaultCategories() {
  if (categoriesSeeded) return;
  const count = await prisma.forumCategory.count();
  if (count === 0) {
    await prisma.forumCategory.createMany({ data: DEFAULT_CATEGORIES, skipDuplicates: true });
  } else {
    // Ensure Gear Reviews exists even if other categories were seeded previously
    const gearReviews = await prisma.forumCategory.findUnique({ where: { slug: "gear-reviews" } });
    if (!gearReviews) {
      await prisma.forumCategory.create({
        data: DEFAULT_CATEGORIES.find((c) => c.slug === "gear-reviews")!,
      });
    }
  }
  categoriesSeeded = true;
}

export async function GET() {
  await ensureDefaultCategories();

  const categories = await prisma.forumCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(categories);
}

// Admin only: create category
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const category = await prisma.forumCategory.create({
    data: { name, slug, description: description || null },
  });

  return NextResponse.json(category, { status: 201 });
}

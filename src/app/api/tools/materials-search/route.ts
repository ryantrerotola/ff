import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ materials: [] });
  }

  const materials = await prisma.material.findMany({
    where: {
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      type: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    take: 20,
  });

  return NextResponse.json({ materials });
}

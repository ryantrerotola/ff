import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { barcode } = await request.json();
  if (!barcode || typeof barcode !== "string") {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  // Look up the product via Open Food Facts (free, no API key needed)
  // This covers many fly tying material UPCs
  let productName: string | null = null;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product?.product_name) {
        productName = data.product.product_name;
      }
    }
  } catch {
    // Open Food Facts lookup failed, try UPC database
  }

  // Also try UPC Item DB as fallback
  if (!productName) {
    try {
      const res = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.items?.[0]?.title) {
          productName = data.items[0].title;
        }
      }
    } catch {
      // UPC lookup failed
    }
  }

  // Try to fuzzy-match the product name to materials in our database
  if (productName) {
    const words = productName.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    // Search for materials matching any significant word
    const materials = await prisma.material.findMany({
      where: {
        OR: words.map((word: string) => ({
          name: { contains: word, mode: "insensitive" as const },
        })),
      },
      take: 10,
    });

    if (materials.length > 0) {
      return NextResponse.json({
        barcode,
        productName,
        matched: true,
        materials: materials.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
        })),
      });
    }

    return NextResponse.json({
      barcode,
      productName,
      matched: false,
      materials: [],
      message: `Found "${productName}" but couldn't match it to materials in the database. You can search and add it manually.`,
    });
  }

  return NextResponse.json({
    barcode,
    productName: null,
    matched: false,
    materials: [],
    message: "Barcode not found in product databases. Try searching by material name instead.",
  });
}

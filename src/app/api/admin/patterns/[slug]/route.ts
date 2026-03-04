import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updatePatternSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["dry", "nymph", "streamer", "emerger", "saltwater", "other"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  waterType: z.enum(["freshwater", "saltwater", "both"]).optional(),
  origin: z.string().nullable().optional(),
});

const updateMaterialSchema = z.object({
  action: z.literal("updateMaterial"),
  flyPatternMaterialId: z.string().uuid(),
  materialName: z.string().min(1).optional(),
  materialType: z.enum(["hook", "thread", "tail", "body", "rib", "thorax", "wing", "hackle", "bead", "weight", "other"]).optional(),
  customColor: z.string().nullable().optional(),
  customSize: z.string().nullable().optional(),
});

const deleteMaterialSchema = z.object({
  action: z.literal("deleteMaterial"),
  flyPatternMaterialId: z.string().uuid(),
});

const deleteImageSchema = z.object({
  action: z.literal("deleteImage"),
  imageId: z.string().uuid(),
});

const setPrimaryImageSchema = z.object({
  action: z.literal("setPrimaryImage"),
  imageId: z.string().uuid(),
});

const actionSchema = z.discriminatedUnion("action", [
  updateMaterialSchema,
  deleteMaterialSchema,
  deleteImageSchema,
  setPrimaryImageSchema,
]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;

  const pattern = await prisma.flyPattern.findUnique({
    where: { slug },
    include: {
      materials: {
        orderBy: { position: "asc" },
        include: {
          material: true,
        },
      },
      images: {
        include: { uploadedBy: { select: { username: true } } },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      variations: true,
      resources: { orderBy: { qualityScore: "desc" } },
      tyingSteps: { orderBy: { position: "asc" } },
    },
  });

  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  // Get previous and next patterns (alphabetical order by name)
  const [prev, next] = await Promise.all([
    prisma.flyPattern.findFirst({
      where: { name: { lt: pattern.name } },
      orderBy: { name: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.flyPattern.findFirst({
      where: { name: { gt: pattern.name } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  return NextResponse.json({ ...pattern, _nav: { prev, next } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;

  const pattern = await prisma.flyPattern.findUnique({ where: { slug } });
  if (!pattern) {
    return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check if this is an action (material/image operation) or a pattern update
  const actionParsed = actionSchema.safeParse(body);
  if (actionParsed.success) {
    const data = actionParsed.data;

    if (data.action === "deleteMaterial") {
      await prisma.flyPatternMaterial.delete({
        where: { id: data.flyPatternMaterialId },
      });
      return NextResponse.json({ ok: true });
    }

    if (data.action === "updateMaterial") {
      const fpm = await prisma.flyPatternMaterial.findUnique({
        where: { id: data.flyPatternMaterialId },
        include: { material: true },
      });
      if (!fpm) {
        return NextResponse.json({ error: "Material link not found" }, { status: 404 });
      }

      // Update the material record itself if name/type changed
      if (data.materialName !== undefined || data.materialType !== undefined) {
        const newName = data.materialName ?? fpm.material.name;
        const newType = data.materialType ?? fpm.material.type;

        // Check if a material with the new name+type already exists
        const existing = await prisma.material.findFirst({
          where: { name: newName, type: newType },
        });

        if (existing && existing.id !== fpm.materialId) {
          // Point the join record to the existing material
          await prisma.flyPatternMaterial.update({
            where: { id: data.flyPatternMaterialId },
            data: {
              materialId: existing.id,
              ...(data.customColor !== undefined ? { customColor: data.customColor } : {}),
              ...(data.customSize !== undefined ? { customSize: data.customSize } : {}),
            },
          });
        } else {
          // Update the material in place
          await prisma.material.update({
            where: { id: fpm.materialId },
            data: { name: newName, type: newType },
          });
          // Update color/size on join record
          if (data.customColor !== undefined || data.customSize !== undefined) {
            await prisma.flyPatternMaterial.update({
              where: { id: data.flyPatternMaterialId },
              data: {
                ...(data.customColor !== undefined ? { customColor: data.customColor } : {}),
                ...(data.customSize !== undefined ? { customSize: data.customSize } : {}),
              },
            });
          }
        }
      } else {
        // Just updating color/size
        await prisma.flyPatternMaterial.update({
          where: { id: data.flyPatternMaterialId },
          data: {
            ...(data.customColor !== undefined ? { customColor: data.customColor } : {}),
            ...(data.customSize !== undefined ? { customSize: data.customSize } : {}),
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (data.action === "deleteImage") {
      await prisma.patternImage.delete({ where: { id: data.imageId } });
      return NextResponse.json({ ok: true });
    }

    if (data.action === "setPrimaryImage") {
      // Unset all primary images for this pattern, then set the selected one
      await prisma.$transaction([
        prisma.patternImage.updateMany({
          where: { flyPatternId: pattern.id },
          data: { isPrimary: false },
        }),
        prisma.patternImage.update({
          where: { id: data.imageId },
          data: { isPrimary: true },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }
  }

  // Otherwise treat as pattern field update
  const parsed = updatePatternSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updated = await prisma.flyPattern.update({
    where: { slug },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

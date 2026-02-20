import { prisma } from "@/lib/prisma";
import type { MaterialWithSubstitutions } from "@/lib/types";

export async function getMaterialById(
  id: string
): Promise<MaterialWithSubstitutions | null> {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      substitutionsFrom: {
        include: {
          substituteMaterial: {
            include: {
              affiliateLinks: true,
            },
          },
        },
      },
      affiliateLinks: true,
    },
  });

  return material as MaterialWithSubstitutions | null;
}

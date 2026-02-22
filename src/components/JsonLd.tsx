import type { FlyPatternDetail } from "@/lib/types";
import { APP_URL } from "@/lib/constants";

interface JsonLdProps {
  pattern: FlyPatternDetail;
}

export function JsonLd({ pattern }: JsonLdProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${pattern.name} Fly Pattern`,
    description: pattern.description,
    url: `${APP_URL}/patterns/${pattern.slug}`,
    supply: pattern.materials.map((pm) => ({
      "@type": "HowToSupply",
      name: pm.material.name,
      ...(pm.customColor ? { color: pm.customColor } : {}),
    })),
    step:
      pattern.tyingSteps && pattern.tyingSteps.length > 0
        ? pattern.tyingSteps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.instruction,
            ...(s.imageUrl ? { image: s.imageUrl } : {}),
          }))
        : pattern.materials
            .filter((pm) => pm.required)
            .map((pm, index) => ({
              "@type": "HowToStep",
              position: index + 1,
              name: `Add ${pm.material.type}: ${pm.material.name}`,
              text: pm.customColor
                ? `Use ${pm.material.name} in ${pm.customColor}`
                : `Use ${pm.material.name}`,
            })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

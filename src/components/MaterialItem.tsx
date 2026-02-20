import type { FlyPatternMaterialWithDetails } from "@/lib/types";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { SubstitutionList } from "./SubstitutionList";
import { AffiliateLinks } from "./AffiliateLinks";

interface MaterialItemProps {
  patternMaterial: FlyPatternMaterialWithDetails;
}

export function MaterialItem({ patternMaterial }: MaterialItemProps) {
  const { material, customColor, customSize, required } = patternMaterial;
  const typeLabel =
    MATERIAL_TYPE_LABELS[material.type] ?? material.type;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {typeLabel}
            </span>
            {!required && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                Optional
              </span>
            )}
          </div>
          <h4 className="mt-1 font-medium text-gray-900">{material.name}</h4>
          {(customColor || customSize) && (
            <p className="mt-0.5 text-sm text-gray-600">
              {[customColor, customSize].filter(Boolean).join(" — ")}
            </p>
          )}
          {material.description && (
            <p className="mt-1 text-sm text-gray-500">
              {material.description}
            </p>
          )}
        </div>
      </div>

      <AffiliateLinks links={material.affiliateLinks} />

      {material.substitutionsFrom.length > 0 && (
        <SubstitutionList substitutions={material.substitutionsFrom} />
      )}
    </div>
  );
}

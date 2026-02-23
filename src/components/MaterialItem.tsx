"use client";

import { useState } from "react";
import type { FlyPatternMaterialWithDetails } from "@/lib/types";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { SubstitutionList } from "./SubstitutionList";
import { AffiliateLinks } from "./AffiliateLinks";
import { MaterialReviews } from "./MaterialReviews";

interface MaterialItemProps {
  patternMaterial: FlyPatternMaterialWithDetails;
}

export function MaterialItem({ patternMaterial }: MaterialItemProps) {
  const { material, customColor, customSize, required } = patternMaterial;
  const typeLabel =
    MATERIAL_TYPE_LABELS[material.type] ?? material.type;
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {typeLabel}
            </span>
            {!required && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                Optional
              </span>
            )}
          </div>
          <h4 className="mt-1 font-medium text-gray-900 dark:text-white">{material.name}</h4>
          {(customColor || customSize) && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {[customColor, customSize].filter(Boolean).join(" — ")}
            </p>
          )}
          {material.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {material.description}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {showReviews ? "Hide Reviews" : "Reviews"}
        </button>
      </div>

      <AffiliateLinks links={material.affiliateLinks} />

      {material.substitutionsFrom.length > 0 && (
        <SubstitutionList substitutions={material.substitutionsFrom} />
      )}

      {showReviews && (
        <MaterialReviews materialId={material.id} materialName={material.name} />
      )}
    </div>
  );
}

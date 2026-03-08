"use client";

import { useState } from "react";
import type { FlyPatternMaterialWithDetails } from "@/lib/types";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { SubstitutionList } from "./SubstitutionList";
import { AffiliateLinks } from "./AffiliateLinks";
import { MaterialReviews } from "./MaterialReviews";

interface MaterialListProps {
  materials: FlyPatternMaterialWithDetails[];
}

/** Deduplicate materials by material.id, keeping the first occurrence. */
function deduplicateMaterials(
  materials: FlyPatternMaterialWithDetails[]
): FlyPatternMaterialWithDetails[] {
  const seen = new Set<string>();
  const result: FlyPatternMaterialWithDetails[] = [];
  for (const m of materials) {
    if (seen.has(m.material.id)) continue;
    seen.add(m.material.id);
    result.push(m);
  }
  return result;
}

/** Material type display order for tying sequence. */
const TYPE_ORDER = [
  "hook", "bead", "weight", "thread", "tail", "body",
  "rib", "thorax", "wing", "hackle", "other",
];

function typeSort(a: string, b: string): number {
  const ai = TYPE_ORDER.indexOf(a);
  const bi = TYPE_ORDER.indexOf(b);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
}

/** Group materials by type, preserving tying order. */
function groupByType(
  materials: FlyPatternMaterialWithDetails[]
): { type: string; items: FlyPatternMaterialWithDetails[] }[] {
  const groups = new Map<string, FlyPatternMaterialWithDetails[]>();
  for (const m of materials) {
    const type = m.material.type;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type)!.push(m);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => typeSort(a, b))
    .map(([type, items]) => ({ type, items }));
}

function MaterialRow({ pm }: { pm: FlyPatternMaterialWithDetails }) {
  const { material, customColor, customSize, required } = pm;
  const [expanded, setExpanded] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const hasSubs = material.substitutionsFrom.length > 0;
  const hasLinks = material.affiliateLinks.length > 0;
  const hasExpandable = hasSubs || hasLinks;

  const details = [customColor, customSize].filter(Boolean).join(" — ");

  return (
    <div className="group">
      <div className="flex items-baseline gap-2 py-1">
        <span className="font-medium text-gray-900 dark:text-white">
          {material.name}
        </span>
        {details && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {details}
          </span>
        )}
        {!required && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            optional
          </span>
        )}
        <span className="flex-1" />
        {hasExpandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {expanded ? "Less" : hasSubs ? `${material.substitutionsFrom.length} sub${material.substitutionsFrom.length !== 1 ? "s" : ""}` : "Buy"}
          </button>
        )}
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="hidden text-xs font-medium text-gray-400 hover:text-brand-600 group-hover:inline dark:text-gray-500 dark:hover:text-brand-400"
        >
          {showReviews ? "Hide" : "Reviews"}
        </button>
      </div>
      {expanded && (
        <div className="pb-2 pl-4">
          {hasLinks && <AffiliateLinks links={material.affiliateLinks} />}
          {hasSubs && <SubstitutionList substitutions={material.substitutionsFrom} />}
        </div>
      )}
      {showReviews && (
        <div className="pb-2 pl-4">
          <MaterialReviews materialId={material.id} materialName={material.name} />
        </div>
      )}
    </div>
  );
}

export function MaterialList({ materials }: MaterialListProps) {
  const deduped = deduplicateMaterials(materials);
  const groups = groupByType(deduped);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Materials
      </h2>

      <div className="space-y-4">
        {groups.map(({ type, items }) => (
          <div key={type}>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {MATERIAL_TYPE_LABELS[type] ?? type}
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((pm) => (
                <MaterialRow key={pm.id} pm={pm} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

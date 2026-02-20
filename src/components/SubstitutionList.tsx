"use client";

import { useState } from "react";
import type { MaterialSubstitution, Material, AffiliateLink } from "@/lib/types";
import { SUBSTITUTION_TYPE_LABELS } from "@/lib/constants";

interface SubstitutionWithMaterial extends MaterialSubstitution {
  substituteMaterial: Material & {
    affiliateLinks: AffiliateLink[];
  };
}

interface SubstitutionListProps {
  substitutions: SubstitutionWithMaterial[];
}

export function SubstitutionList({ substitutions }: SubstitutionListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (substitutions.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        {substitutions.length} substitute{substitutions.length !== 1 ? "s" : ""}{" "}
        available
      </button>

      {isExpanded && (
        <ul className="mt-2 space-y-2 pl-5">
          {substitutions.map((sub) => (
            <li key={sub.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">
                  {sub.substituteMaterial.name}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {SUBSTITUTION_TYPE_LABELS[sub.substitutionType]}
                </span>
              </div>
              {sub.notes && (
                <p className="mt-0.5 text-gray-500">{sub.notes}</p>
              )}
              {sub.substituteMaterial.affiliateLinks.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {sub.substituteMaterial.affiliateLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-xs text-brand-600 underline hover:text-brand-700"
                    >
                      Buy at {link.retailer}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { FlyPatternMaterialWithDetails } from "@/lib/types";
import { MaterialItem } from "./MaterialItem";

interface MaterialListProps {
  materials: FlyPatternMaterialWithDetails[];
}

export function MaterialList({ materials }: MaterialListProps) {
  const requiredMaterials = materials.filter((m) => m.required);
  const optionalMaterials = materials.filter((m) => !m.required);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Materials (Tying Order)
      </h2>

      {requiredMaterials.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Required
          </h3>
          <div className="space-y-3">
            {requiredMaterials.map((pm) => (
              <MaterialItem key={pm.id} patternMaterial={pm} />
            ))}
          </div>
        </div>
      )}

      {optionalMaterials.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Optional
          </h3>
          <div className="space-y-3">
            {optionalMaterials.map((pm) => (
              <MaterialItem key={pm.id} patternMaterial={pm} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

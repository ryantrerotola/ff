import type { FlyPatternListItem } from "@/lib/types";
import { PatternCard } from "./PatternCard";

interface PatternListProps {
  patterns: FlyPatternListItem[];
}

export function PatternList({ patterns }: PatternListProps) {
  if (patterns.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-gray-500">
          No patterns found matching your criteria.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {patterns.map((pattern) => (
        <PatternCard key={pattern.id} pattern={pattern} />
      ))}
    </div>
  );
}

import type { PipelineStats } from "@/pipeline/types";

interface PipelineStatsPanelProps {
  stats: PipelineStats;
}

export function PipelineStatsPanel({ stats }: PipelineStatsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Sources */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">Sources</h3>
        <div className="mt-3 space-y-2">
          <StatRow label="Discovered" value={stats.sources.discovered} />
          <StatRow label="Scraped" value={stats.sources.scraped} />
          <StatRow label="Extracted" value={stats.sources.extracted} />
        </div>
      </div>

      {/* Extractions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">Extractions</h3>
        <div className="mt-3 space-y-2">
          <StatRow label="Total" value={stats.extractions.total} />
          <StatRow
            label="High Confidence"
            value={stats.extractions.highConfidence}
            color="text-green-600"
          />
          <StatRow
            label="Low Confidence"
            value={stats.extractions.lowConfidence}
            color="text-yellow-600"
          />
        </div>
      </div>

      {/* Patterns */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-medium text-gray-500">Patterns</h3>
        <div className="mt-3 space-y-2">
          <StatRow label="Normalized" value={stats.patterns.normalized} />
          <StatRow
            label="Approved"
            value={stats.patterns.approved}
            color="text-green-600"
          />
          <StatRow
            label="Rejected"
            value={stats.patterns.rejected}
            color="text-red-600"
          />
          <StatRow
            label="Ingested"
            value={stats.patterns.ingested}
            color="text-brand-600"
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color ?? "text-gray-900"}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

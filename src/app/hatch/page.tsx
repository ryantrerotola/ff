"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface HatchEntry {
  id: string;
  waterBody: string;
  region: string;
  state: string | null;
  month: number;
  species: string;
  insectName: string;
  insectType: string;
  patternName: string;
  timeOfDay: string | null;
  targetFish: string | null;
  notes: string | null;
  flyPattern: { id: string; name: string; slug: string } | null;
  submittedBy: { username: string; displayName: string | null } | null;
}

interface Filters {
  regions: string[];
  waterBodies: string[];
}

type GroupedByWater = Record<string, { state: string | null; region: string; entries: HatchEntry[] }>;

export default function HatchPage() {
  const [entries, setEntries] = useState<HatchEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({ regions: [], waterBodies: [] });
  const [loading, setLoading] = useState(true);
  const [waterBody, setWaterBody] = useState("");
  const [region, setRegion] = useState("");
  const [month, setMonth] = useState(0); // 0 = all months
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWaterBodies, setTotalWaterBodies] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [expandedWater, setExpandedWater] = useState<string | null>(null);

  function fetchEntries(pageNum = page) {
    setLoading(true);
    const params = new URLSearchParams();
    if (waterBody) params.set("waterBody", waterBody);
    if (region) params.set("region", region);
    if (month) params.set("month", String(month));
    params.set("page", String(pageNum));

    fetch(`/api/hatch?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries);
        setFilters(data.filters);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalWaterBodies(data.totalWaterBodies);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEntries(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchEntries(1);
  }

  function goToPage(p: number) {
    setExpandedWater(null);
    setPage(p);
    fetchEntries(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Group entries by water body
  const grouped: GroupedByWater = {};
  for (const entry of entries) {
    if (!grouped[entry.waterBody]) {
      grouped[entry.waterBody] = { state: entry.state, region: entry.region, entries: [] };
    }
    grouped[entry.waterBody]!.entries.push(entry);
  }
  const waterBodies = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hatch Charts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Look up any body of water to see what hatches when. Filter by time of year.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Hide Form" : "Add Report"}
        </button>
      </div>

      {showForm && <HatchForm onSuccess={() => { setShowForm(false); fetchEntries(1); }} />}

      {/* Filters */}
      <form onSubmit={handleSearch} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          value={waterBody}
          onChange={(e) => setWaterBody(e.target.value)}
          placeholder="Search water body..."
          list="waterBodies"
          className="col-span-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:col-span-1"
        />
        <datalist id="waterBodies">
          {filters.waterBodies.map((w) => <option key={w} value={w} />)}
        </datalist>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Regions</option>
          {filters.regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value={0}>All Months</option>
          {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>

        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {/* Results — grouped by water body */}
      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : waterBodies.length === 0 ? (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p>No hatch data found for those filters.</p>
          <p className="mt-1 text-sm">Try broadening your search or be the first to add a report.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {waterBodies.map((wb) => {
            const group = grouped[wb]!;
            const isExpanded = expandedWater === wb;

            // Group entries by month for the expanded view
            const byMonth: Record<number, HatchEntry[]> = {};
            for (const e of group.entries) {
              if (!byMonth[e.month]) byMonth[e.month] = [];
              byMonth[e.month]!.push(e);
            }
            const activeMonths = Object.keys(byMonth).map(Number).sort((a, b) => a - b);

            // Summary: unique insect types for the collapsed preview
            const insectTypes = [...new Set(group.entries.map((e) => e.insectType))];
            const monthRange = activeMonths.length > 0
              ? `${MONTHS[activeMonths[0]! - 1]}–${MONTHS[activeMonths[activeMonths.length - 1]! - 1]}`
              : "";

            return (
              <div
                key={wb}
                className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Water body header — always visible */}
                <button
                  onClick={() => setExpandedWater(isExpanded ? null : wb)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {wb}
                      {group.state && <span className="ml-1.5 text-sm font-normal text-gray-400">{group.state}</span>}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {group.region}
                      {monthRange && <span className="mx-1.5">·</span>}
                      {monthRange}
                      <span className="mx-1.5">·</span>
                      {group.entries.length} {group.entries.length === 1 ? "hatch" : "hatches"}
                      <span className="mx-1.5">·</span>
                      {insectTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}
                    </p>
                  </div>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded: hatches grouped by month */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4">
                    {activeMonths.map((m) => (
                      <div key={m} className="mt-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                          {FULL_MONTHS[m - 1]}
                        </h4>
                        <div className="mt-1.5 space-y-1.5">
                          {byMonth[m]!.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {entry.insectName}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.species}
                              </span>
                              <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {entry.insectType}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500">→</span>
                              {entry.flyPattern ? (
                                <Link
                                  href={`/patterns/${entry.flyPattern.slug}`}
                                  className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                >
                                  {entry.flyPattern.name}
                                </Link>
                              ) : (
                                <span className="font-medium text-gray-700 dark:text-gray-300">{entry.patternName}</span>
                              )}
                              {entry.timeOfDay && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{entry.timeOfDay}</span>
                              )}
                              {entry.targetFish && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">· {entry.targetFish}</span>
                              )}
                              {entry.notes && (
                                <p className="basis-full text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entry.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalWaterBodies} water {totalWaterBodies === 1 ? "body" : "bodies"} &middot; Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HatchForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/hatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        waterBody: fd.get("waterBody"),
        region: fd.get("region"),
        state: fd.get("state") || null,
        month: Number(fd.get("month")),
        species: fd.get("species"),
        insectName: fd.get("insectName"),
        insectType: fd.get("insectType"),
        patternName: fd.get("patternName"),
        timeOfDay: fd.get("timeOfDay") || null,
        targetFish: fd.get("targetFish") || null,
        notes: fd.get("notes") || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(res.status === 401 ? "Please log in to submit" : data.error || "Failed");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Report a Hatch</h3>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <input name="waterBody" required placeholder="Water body *" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <input name="region" required placeholder="Region *" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <input name="state" placeholder="State (optional)" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <select name="month" required defaultValue={new Date().getMonth() + 1} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm">
          {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input name="species" required placeholder="Insect species *" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <input name="insectName" required placeholder="Hatch name *" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <select name="insectType" required className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm">
          <option value="">Insect type *</option>
          <option value="mayfly">Mayfly</option>
          <option value="caddis">Caddis</option>
          <option value="stonefly">Stonefly</option>
          <option value="midge">Midge</option>
          <option value="terrestrial">Terrestrial</option>
          <option value="other">Other</option>
        </select>
        <input name="patternName" required placeholder="Suggested pattern *" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
        <select name="targetFish" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm">
          <option value="">Target fish</option>
          <option value="Rainbow Trout">Rainbow Trout</option>
          <option value="Brown Trout">Brown Trout</option>
          <option value="Brook Trout">Brook Trout</option>
          <option value="Cutthroat Trout">Cutthroat Trout</option>
          <option value="Steelhead">Steelhead</option>
          <option value="Salmon">Salmon</option>
          <option value="Smallmouth Bass">Smallmouth Bass</option>
          <option value="Largemouth Bass">Largemouth Bass</option>
          <option value="Panfish">Panfish</option>
          <option value="Carp">Carp</option>
          <option value="Bonefish">Bonefish</option>
          <option value="Tarpon">Tarpon</option>
          <option value="Redfish">Redfish</option>
          <option value="Pike">Pike</option>
          <option value="Musky">Musky</option>
        </select>
        <select name="timeOfDay" className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm">
          <option value="">Time of day</option>
          <option value="morning">Morning</option>
          <option value="midday">Midday</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="all day">All Day</option>
        </select>
      </div>
      <textarea name="notes" placeholder="Notes (optional)" rows={2} className="mt-3 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm" />
      <button type="submit" disabled={loading} className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

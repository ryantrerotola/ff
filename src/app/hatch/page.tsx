"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MONTHS = [
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
  notes: string | null;
  flyPattern: { id: string; name: string; slug: string } | null;
  submittedBy: { username: string; displayName: string | null } | null;
}

interface Filters {
  regions: string[];
  waterBodies: string[];
  species: string[];
}

export default function HatchPage() {
  const [entries, setEntries] = useState<HatchEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({ regions: [], waterBodies: [], species: [] });
  const [loading, setLoading] = useState(true);
  const [waterBody, setWaterBody] = useState("");
  const [region, setRegion] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [species, setSpecies] = useState("");
  const [showForm, setShowForm] = useState(false);

  function fetchEntries() {
    setLoading(true);
    const params = new URLSearchParams();
    if (waterBody) params.set("waterBody", waterBody);
    if (region) params.set("region", region);
    if (month) params.set("month", String(month));
    if (species) params.set("species", species);

    fetch(`/api/hatch?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries);
        setFilters(data.filters);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEntries();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hatch Chart</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find what&apos;s hatching on your water. Search by location, month, and species.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Hide Form" : "Add Report"}
        </button>
      </div>

      {/* Submission form */}
      {showForm && <HatchForm onSuccess={() => { setShowForm(false); fetchEntries(); }} />}

      {/* Filters */}
      <form onSubmit={handleSearch} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <input
          value={waterBody}
          onChange={(e) => setWaterBody(e.target.value)}
          placeholder="Water body..."
          list="waterBodies"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <datalist id="waterBodies">
          {filters.waterBodies.map((w) => <option key={w} value={w} />)}
        </datalist>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Regions</option>
          {filters.regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>

        <div className="flex gap-2">
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Species</option>
            {filters.species.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p>No hatch data found for those filters.</p>
          <p className="mt-1 text-sm">Be the first to add a report!</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2">Water Body</th>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Species</th>
                <th className="px-3 py-2">Hatch</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Pattern</th>
                <th className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
                    {entry.waterBody}
                    {entry.state && <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{entry.state}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{MONTHS[entry.month - 1]}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{entry.species}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{entry.insectName}</td>
                  <td className="px-3 py-2.5 capitalize text-gray-500 dark:text-gray-400">{entry.insectType}</td>
                  <td className="px-3 py-2.5">
                    {entry.flyPattern ? (
                      <Link href={`/patterns/${entry.flyPattern.slug}`} className="text-brand-600 hover:text-brand-700">
                        {entry.flyPattern.name}
                      </Link>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">{entry.patternName}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{entry.timeOfDay ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <input name="waterBody" required placeholder="Water body *" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <input name="region" required placeholder="Region *" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <input name="state" placeholder="State (optional)" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <select name="month" required defaultValue={new Date().getMonth() + 1} className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input name="species" required placeholder="Species *" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <input name="insectName" required placeholder="Hatch name *" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <select name="insectType" required className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
          <option value="">Insect type *</option>
          <option value="mayfly">Mayfly</option>
          <option value="caddis">Caddis</option>
          <option value="stonefly">Stonefly</option>
          <option value="midge">Midge</option>
          <option value="terrestrial">Terrestrial</option>
          <option value="other">Other</option>
        </select>
        <input name="patternName" required placeholder="Suggested pattern *" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
        <select name="timeOfDay" className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
          <option value="">Time of day</option>
          <option value="morning">Morning</option>
          <option value="midday">Midday</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="all day">All Day</option>
        </select>
      </div>
      <textarea name="notes" placeholder="Notes (optional)" rows={2} className="mt-3 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm" />
      <button type="submit" disabled={loading} className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}

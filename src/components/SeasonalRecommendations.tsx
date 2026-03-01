"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface HatchRecommendation {
  id: string;
  species: string;
  insectName: string;
  insectType: string;
  pattern: { id: string | null; name: string; slug: string | null };
  timeOfDay: string | null;
  waterBody: string;
  region: string;
}

/**
 * Map lat/lng to the nearest fly fishing region.
 * Uses simple bounding-box approximations for US regions.
 */
function detectRegion(lat: number, lng: number): string {
  // Saltwater: coastal Florida, Gulf coast, Outer Banks
  if (lat < 28 && lng > -83) return "Saltwater";
  if (lat < 30 && lng > -90 && lng < -80) return "Saltwater";

  // Rocky Mountains: CO, WY, MT, ID (roughly -115 to -104, 37-49)
  if (lng >= -115 && lng <= -104 && lat >= 37 && lat <= 49) return "Rocky Mountains";

  // Pacific Northwest: OR, WA (roughly -125 to -116, 42-49)
  if (lng >= -125 && lng <= -116 && lat >= 42 && lat <= 49) return "Pacific Northwest";

  // Southwest: NM, AZ, UT, NV
  if (lng >= -115 && lng <= -104 && lat >= 31 && lat < 37) return "Southwest";
  if (lng >= -120 && lng <= -109 && lat >= 36 && lat <= 42) return "Southwest";

  // Great Lakes: MI, WI, MN, OH
  if (lng >= -93 && lng <= -80 && lat >= 41 && lat <= 49) return "Great Lakes";

  // Mid-Atlantic: VA, MD, DC, NJ, DE
  if (lng >= -80 && lng <= -73 && lat >= 37 && lat <= 41) return "Mid-Atlantic";

  // Southeast: TN, NC, SC, GA, AL, AR
  if (lng >= -90 && lng <= -76 && lat >= 30 && lat <= 37) return "Southeast";

  // Northeast: NY, PA, CT, MA, VT, NH, ME
  if (lng >= -80 && lng <= -67 && lat >= 40 && lat <= 47) return "Northeast";

  // Midwest: IA, MO, IL, IN, KS, NE
  if (lng >= -104 && lng <= -84 && lat >= 36 && lat <= 43) return "Midwest";

  // Alaska
  if (lat > 54) return "Alaska";

  // Default
  return "";
}

export function SeasonalRecommendations() {
  const [hatches, setHatches] = useState<HatchRecommendation[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "found" | "denied" | "error">("loading");
  const [loaded, setLoaded] = useState(false);

  const currentMonth = new Date().getMonth() + 1;

  // Step 1: Try to get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = detectRegion(pos.coords.latitude, pos.coords.longitude);
        setRegion(detected || null);
        setLocationStatus("found");
      },
      () => {
        setLocationStatus("denied");
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  }, []);

  // Step 2: Fetch hatches once location is resolved (or failed)
  useEffect(() => {
    if (locationStatus === "loading") return;

    const params = new URLSearchParams();
    params.set("month", String(currentMonth));
    if (region) params.set("region", region);

    fetch(`/api/recommendations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        // Deduplicate by insectName
        const seen = new Set<string>();
        const unique = (data.hatches ?? []).filter((h: HatchRecommendation) => {
          const key = h.insectName.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setHatches(unique.slice(0, 8));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [locationStatus, region, currentMonth]);

  if (loaded && hatches.length === 0) return null;

  return (
    <section className="my-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        What&apos;s Hatching Now
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {region
          ? `${MONTH_NAMES[currentMonth - 1]} hatches near you (${region})`
          : `Recommended patterns for ${MONTH_NAMES[currentMonth - 1]}`}
        {locationStatus === "denied" && (
          <span className="ml-1">
            · <button onClick={() => setRegion(null)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">Enable location</button> for local results
          </span>
        )}
      </p>

      {!loaded ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hatches.map((hatch) => {
            const patternHref = hatch.pattern.slug
              ? `/patterns/${hatch.pattern.slug}`
              : null;

            const card = (
              <div className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  {hatch.insectType}
                </div>
                <h3 className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {hatch.insectName}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {hatch.species}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {hatch.waterBody}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                    {hatch.pattern.name}
                  </span>
                  {hatch.timeOfDay && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {hatch.timeOfDay}
                    </span>
                  )}
                </div>
              </div>
            );

            return patternHref ? (
              <Link key={hatch.id} href={patternHref}>
                {card}
              </Link>
            ) : (
              <div key={hatch.id}>{card}</div>
            );
          })}
        </div>
      )}

      <div className="mt-3 text-right">
        <Link
          href="/hatch"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          View full hatch chart &rarr;
        </Link>
      </div>
    </section>
  );
}

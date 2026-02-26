"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapFishingReport {
  id: string;
  waterBody: string;
  region: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  summary: string;
  conditions: string | null;
  sourceUrls: string[];
  sourceTitles: string[];
  reportDate: string;
  updatedAt: string;
}

interface ReportsMapProps {
  reports: MapFishingReport[];
  onSelectReport: (report: MapFishingReport) => void;
}

const fishIcon = L.divIcon({
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#2563eb;border-radius:50%;border:2px solid #1d4ed8;color:white;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🐟</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function ReportsMap({
  reports,
  onSelectReport,
}: ReportsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map centered on US
    const map = L.map(mapRef.current, {
      center: [39.8, -98.6],
      zoom: 4,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each report
    const markers: L.Marker[] = [];

    for (const report of reports) {
      if (report.latitude == null || report.longitude == null) continue;

      const marker = L.marker([report.latitude, report.longitude], {
        icon: fishIcon,
        title: report.waterBody,
      });

      // Simple tooltip on hover
      marker.bindTooltip(
        `<strong>${report.waterBody}</strong>${report.state ? `, ${report.state}` : ""}`,
        { direction: "top", offset: [0, -16] }
      );

      marker.on("click", () => {
        onSelectReport(report);
      });

      marker.addTo(map);
      markers.push(marker);
    }

    // Fit map bounds to markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [reports, onSelectReport]);

  return (
    <div
      ref={mapRef}
      className="h-[600px] w-full rounded-lg border border-gray-200 dark:border-gray-700"
      style={{ zIndex: 0 }}
    />
  );
}

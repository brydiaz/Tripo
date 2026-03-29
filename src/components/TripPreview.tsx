"use client";

import { Position } from "@/types/trip";

type TripPreviewProps = {
  points: Position[];
  width?: number;
  height?: number;
};

export default function TripPreview({
  points,
  width = 280,
  height = 100,
}: TripPreviewProps) {
  if (!points || points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-white/5 text-xs text-white/35"
        style={{ width: "100%", height }}
      >
        Sin preview
      </div>
    );
  }

  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padding = 10;

  const latRange = maxLat - minLat || 0.0001;
  const lngRange = maxLng - minLng || 0.0001;

  const scaledPoints = points.map(([lat, lng]) => {
    const x =
      padding + ((lng - minLng) / lngRange) * (width - padding * 2);

    const y =
      height -
      padding -
      ((lat - minLat) / latRange) * (height - padding * 2);

    return [x, y];
  });

  const polylinePoints = scaledPoints.map(([x, y]) => `${x},${y}`).join(" ");
  const start = scaledPoints[0];
  const end = scaledPoints[scaledPoints.length - 1];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/8 bg-white/5"
      style={{ width: "100%", height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trip-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2D9CDB" />
            <stop offset="100%" stopColor="#56CCF2" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        <polyline
          points={polylinePoints}
          fill="none"
          stroke="url(#trip-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx={start[0]} cy={start[1]} r="4" fill="#27AE60" />
        <circle cx={end[0]} cy={end[1]} r="4" fill="#F59E0B" />
      </svg>
    </div>
  );
}
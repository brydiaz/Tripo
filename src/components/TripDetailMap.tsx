"use client";

import { useEffect } from "react";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { Position } from "@/types/trip";

type TripDetailMapProps = {
  points: Position[];
};

function FitBounds({ points }: { points: Position[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    map.fitBounds(points, {
      padding: [30, 30],
    });
  }, [points, map]);

  return null;
}

export default function TripDetailMap({ points }: TripDetailMapProps) {
  const fallbackCenter: Position = [9.9281, -84.0907];
  const center = points.length > 0 ? points[0] : fallbackCenter;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />

        {points.length > 1 && (
          <>
            <Polyline positions={points} pathOptions={{ color: "#2D9CDB" }} />
            <FitBounds points={points} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
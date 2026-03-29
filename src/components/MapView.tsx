"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";

type Position = [number, number];

type MapViewProps = {
  zoom?: number;
};

function RecenterMap({ center }: { center: Position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

export default function MapView({ zoom = 16 }: MapViewProps) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setError("");
      },
      () => {
        setError("No se pudo actualizar tu ubicación.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const defaultCenter: Position = [9.9281, -84.0907];
  const currentCenter = position ?? defaultCenter;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={currentCenter} />

        <CircleMarker
          center={currentCenter}
          radius={10}
          pathOptions={{ color: "#27AE60" }}
        >
          <Popup>Tu ubicación actual</Popup>
        </CircleMarker>
      </MapContainer>

      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            color: "white",
            padding: "10px 14px",
            borderRadius: "12px",
            fontSize: "14px",
          }}
        >
            <div>secure: {String(window.isSecureContext)}</div>
  <div>geo: {String(!!navigator.geolocation)}</div>
          {error}
        </div>
      )}
    </div>
  );
}
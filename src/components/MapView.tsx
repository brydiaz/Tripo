"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
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
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [route, setRoute] = useState<Position[]>([]);

  const defaultCenter: Position = [9.9281, -84.0907];
  const currentCenter = position ?? defaultCenter;

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = [pos.coords.latitude, pos.coords.longitude];

        setPosition(newPos);
        setError("");

        if (isRecording) {
          setRoute((prev) => {
            const lastPoint = prev[prev.length - 1];

            if (
              lastPoint &&
              lastPoint[0] === newPos[0] &&
              lastPoint[1] === newPos[1]
            ) {
              return prev;
            }

            return [...prev, newPos];
          });
        }
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
  }, [isRecording]);

  const secureInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        secure: false,
        geo: false,
      };
    }

    return {
      secure: window.isSecureContext,
      geo: !!navigator.geolocation,
    };
  }, []);

  const handleToggleRecording = () => {
    if (!isRecording) {
      if (position) {
        setRoute([position]);
      } else {
        setRoute([]);
      }
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    console.log("Ruta grabada:", route);
  };

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

        {route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: "#2D9CDB" }} />
        )}
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
          {error}
        </div>
      )}

      <button
        onClick={handleToggleRecording}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: isRecording ? "#27AE60" : "#2D9CDB",
          color: "white",
          padding: "14px 20px",
          borderRadius: "20px",
          border: "none",
          fontWeight: "bold",
          fontSize: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          cursor: "pointer",
        }}
      >
        {isRecording ? "Detener grabación" : "Iniciar grabación"}
      </button>

      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 10,
          zIndex: 999,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "12px",
          lineHeight: 1.5,
        }}
      >
        <div>secure: {String(secureInfo.secure)}</div>
        <div>geo: {String(secureInfo.geo)}</div>
        <div>grabando: {String(isRecording)}</div>
        <div>puntos: {route.length}</div>
      </div>
    </div>
  );
}
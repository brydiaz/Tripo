"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { saveTrip } from "@/lib/trips";
import { Position } from "@/types/trip";

type MapViewProps = {
  zoom?: number;
};

const DEMO_ROUTE: Position[] = [
  [9.9281, -84.0907],
  [9.9285, -84.0902],
  [9.929, -84.0896],
  [9.9296, -84.089],
  [9.9301, -84.0885],
  [9.9306, -84.088],
  [9.9311, -84.0874],
  [9.9315, -84.0868],
  [9.932, -84.0862],
  [9.9325, -84.0857],
  [9.933, -84.0852],
  [9.9334, -84.0847],
];

function getDistance(p1: Position, p2: Position) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(p1[0]);
  const lat2 = toRad(p2[0]);
  const dLat = toRad(p2[0] - p1[0]);
  const dLng = toRad(p2[1] - p1[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatElapsedTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

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
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);

  const demoIndexRef = useRef(0);

  const defaultCenter: Position = [9.9281, -84.0907];
  const currentCenter = position ?? defaultCenter;

  useEffect(() => {
    if (!isRecording || !startTime) return;

    const intervalId = window.setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecording, startTime]);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }

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

            if (lastPoint) {
              const d = getDistance(lastPoint, newPos);

              if (d > 1) {
                setDistance((prevDistance) => {
                  const updatedDistance = prevDistance + d;

                  if (startTime) {
                    const totalTimeSec = (Date.now() - startTime) / 1000;
                    if (totalTimeSec > 0) {
                      setSpeed(updatedDistance / totalTimeSec);
                    }
                  }

                  return updatedDistance;
                });
              }
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
  }, [isRecording, isDemoMode, startTime]);

  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    setError("");
    demoIndexRef.current = 0;
    setPosition(DEMO_ROUTE[0]);

    const intervalId = window.setInterval(() => {
      demoIndexRef.current += 1;

      if (demoIndexRef.current >= DEMO_ROUTE.length) {
        demoIndexRef.current = 0;
      }

      const nextPos = DEMO_ROUTE[demoIndexRef.current];
      setPosition(nextPos);

      if (isRecording) {
        setRoute((prev) => {
          const lastPoint = prev[prev.length - 1];

          if (
            lastPoint &&
            lastPoint[0] === nextPos[0] &&
            lastPoint[1] === nextPos[1]
          ) {
            return prev;
          }

          if (lastPoint) {
            const d = getDistance(lastPoint, nextPos);

            if (d > 1) {
              setDistance((prevDistance) => {
                const updatedDistance = prevDistance + d;

                if (startTime) {
                  const totalTimeSec = (Date.now() - startTime) / 1000;
                  if (totalTimeSec > 0) {
                    setSpeed(updatedDistance / totalTimeSec);
                  }
                }

                return updatedDistance;
              });
            }
          }

          return [...prev, nextPos];
        });
      }
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDemoMode, isRecording, startTime]);

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

      setDistance(0);
      setElapsedTime(0);
      setSpeed(0);
      setStartTime(Date.now());
      setIsRecording(true);
      return;
    }

    setIsRecording(false);

    const title = window.prompt("Nombre de la ruta:", `Ruta ${new Date().toLocaleString()}`);

    const trip = {
      id: crypto.randomUUID(),
      title: title?.trim() || `Ruta ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      durationMs: elapsedTime,
      distanceMeters: distance,
      avgSpeedKmh: speed * 3.6,
      points: route,
    };

    saveTrip(trip);
    alert("Ruta guardada correctamente.");
  };

  const handleToggleDemoMode = () => {
    setIsRecording(false);
    setRoute([]);
    setDistance(0);
    setElapsedTime(0);
    setSpeed(0);
    setStartTime(null);
    setError("");
    setIsDemoMode((prev) => !prev);
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
          pathOptions={{ color: isDemoMode ? "#f59e0b" : "#27AE60" }}
        >
          <Popup>
            {isDemoMode ? "Ubicación simulada (modo demo)" : "Tu ubicación actual"}
          </Popup>
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

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={handleToggleDemoMode}
          style={{
            background: isDemoMode ? "#f59e0b" : "rgba(0,0,0,0.75)",
            color: "white",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {isDemoMode ? "Desactivar demo" : "Modo demo"}
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 10,
          zIndex: 999,
          background: "rgba(0,0,0,0.85)",
          color: "white",
          padding: "12px",
          borderRadius: "10px",
          fontSize: "13px",
          lineHeight: 1.7,
          minWidth: "150px",
        }}
      >
        <div>⏱ {formatElapsedTime(elapsedTime)}</div>
        <div>📏 {(distance / 1000).toFixed(2)} km</div>
        <div>⚡ {(speed * 3.6).toFixed(1)} km/h</div>
      </div>

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
        <div>demo: {String(isDemoMode)}</div>
        <div>grabando: {String(isRecording)}</div>
        <div>puntos: {route.length}</div>
      </div>
    </div>
  );
}
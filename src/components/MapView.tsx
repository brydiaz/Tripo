"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { saveTrip } from "@/lib/trips";
import { saveTripToCloud } from "@/lib/trips-cloud";
import { getCurrentUser } from "@/lib/auth";
import { getDrivingRoute, NavigationStep } from "@/lib/routing";
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

const DEMO_SPEED_KMH = 35;

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

function getPathDistance(points: Position[]) {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistance(points[i - 1], points[i]);
  }
  return total;
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

function formatNavMinutes(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60));
}

function findNearestDemoIndex(target: Position) {
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  DEMO_ROUTE.forEach((point, index) => {
    const d = getDistance(point, target);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function buildDemoNavigationRoute(startIndex: number, endIndex: number) {
  if (startIndex === endIndex) {
    return [DEMO_ROUTE[startIndex]];
  }

  if (startIndex < endIndex) {
    return DEMO_ROUTE.slice(startIndex, endIndex + 1);
  }

  return DEMO_ROUTE.slice(endIndex, startIndex + 1).reverse();
}

function buildDemoSteps(routePoints: Position[]): NavigationStep[] {
  if (routePoints.length < 2) return [];

  return routePoints.slice(1).map((point, index) => {
    const from = routePoints[index];
    const distance = getDistance(from, point);
    const duration = distance / (DEMO_SPEED_KMH / 3.6);
    const isLast = index === routePoints.length - 2;

    return {
      instruction: isLast
        ? "Has llegado a tu destino"
        : `Continúa hacia el siguiente punto (${index + 1})`,
      distance,
      duration,
      type: isLast ? 10 : 0,
      wayPoints: [index, index + 1],
    };
  });
}

function findClosestRouteIndex(position: Position, navRoute: Position[]) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  navRoute.forEach((point, index) => {
    const d = getDistance(position, point);
    if (d < closestDistance) {
      closestDistance = d;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function getActiveStepIndex(
  position: Position | null,
  navRoute: Position[],
  steps: NavigationStep[]
) {
  if (!position || navRoute.length === 0 || steps.length === 0) {
    return 0;
  }

  const closestRouteIndex = findClosestRouteIndex(position, navRoute);

  const foundIndex = steps.findIndex(
    (step) => closestRouteIndex <= step.wayPoints[1]
  );

  return foundIndex === -1 ? steps.length - 1 : foundIndex;
}

function RecenterMap({ center }: { center: Position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

function FollowUser({
  position,
  active,
}: {
  position: Position | null;
  active: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position || !active) return;

    map.setView(position, 17, {
      animate: true,
    });
  }, [position, active, map]);

  return null;
}

function MapClickHandler({ onClick }: { onClick: (pos: Position) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });

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

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [navRoute, setNavRoute] = useState<Position[]>([]);
  const [navDistance, setNavDistance] = useState(0);
  const [navDuration, setNavDuration] = useState(0);
  const [navSteps, setNavSteps] = useState<NavigationStep[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [destination, setDestination] = useState<Position | null>(null);
  const [isDrivingMode, setIsDrivingMode] = useState(false);

  const demoIndexRef = useRef(0);
  const demoDestinationIndexRef = useRef<number | null>(null);
  const lastRouteTimeRef = useRef(0);

  const defaultCenter: Position = [9.9281, -84.0907];
  const currentCenter = position ?? defaultCenter;

  const activeStepIndex = useMemo(
    () => getActiveStepIndex(position, navRoute, navSteps),
    [position, navRoute, navSteps]
  );

  const currentStep = navSteps[activeStepIndex] ?? null;
  const nextStep =
    activeStepIndex + 1 < navSteps.length ? navSteps[activeStepIndex + 1] : null;

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

  useEffect(() => {
    if (!isDemoMode) return;
    if (demoDestinationIndexRef.current === null) return;

    const currentIndex = demoIndexRef.current;
    const destinationIndex = demoDestinationIndexRef.current;

    const simulatedRoute = buildDemoNavigationRoute(currentIndex, destinationIndex);
    const simulatedDistance = getPathDistance(simulatedRoute);
    const simulatedDurationSeconds = simulatedDistance / (DEMO_SPEED_KMH / 3.6);
    const simulatedSteps = buildDemoSteps(simulatedRoute);

    setNavRoute(simulatedRoute);
    setNavDistance(simulatedDistance);
    setNavDuration(simulatedDurationSeconds);
    setNavSteps(simulatedSteps);

    if (currentIndex === destinationIndex) {
      setSaveMessage("Destino demo alcanzado.");
    }
  }, [position, isDemoMode]);

  useEffect(() => {
    if (!position || !destination || isDemoMode) return;

    const now = Date.now();
    if (now - lastRouteTimeRef.current < 5000) return;

    lastRouteTimeRef.current = now;

    const reroute = async () => {
      try {
        setIsRouting(true);
        const result = await getDrivingRoute(position, destination);
        setNavRoute(result.coordinates);
        setNavDistance(result.distanceMeters);
        setNavDuration(result.durationSeconds);
        setNavSteps(result.steps);
      } catch {
        // silencioso
      } finally {
        setIsRouting(false);
      }
    };

    reroute();
  }, [position, destination, isDemoMode]);

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
      setSaveMessage("");
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    setTripTitle(`Ruta ${new Date().toLocaleString()}`);
    setIsSaveModalOpen(true);
  };

  const handleSaveTrip = async () => {
    const finalTitle = tripTitle.trim() || `Ruta ${new Date().toLocaleString()}`;

    const trip = {
      id: crypto.randomUUID(),
      title: finalTitle,
      createdAt: new Date().toISOString(),
      durationMs: elapsedTime,
      distanceMeters: distance,
      avgSpeedKmh: speed * 3.6,
      points: route,
    };

    try {
      setIsSaving(true);
      setSaveMessage("");

      const user = await getCurrentUser();

      if (user) {
        await saveTripToCloud(trip);
        setSaveMessage("Ruta guardada en la nube ☁️");
      } else {
        saveTrip(trip);
        setSaveMessage("Ruta guardada en este dispositivo 📱");
      }

      setIsSaveModalOpen(false);
      setTripTitle("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al guardar la ruta.";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setIsSaveModalOpen(false);
    setTripTitle("");
  };

  const handleToggleDemoMode = () => {
    setIsRecording(false);
    setRoute([]);
    setDistance(0);
    setElapsedTime(0);
    setSpeed(0);
    setStartTime(null);
    setError("");
    setSaveMessage("");
    setIsSaveModalOpen(false);
    setTripTitle("");
    setNavRoute([]);
    setNavDistance(0);
    setNavDuration(0);
    setNavSteps([]);
    setDestination(null);
    setIsDrivingMode(false);
    demoDestinationIndexRef.current = null;
    setIsDemoMode((prev) => !prev);
  };

  const handleStartNavigation = async () => {
    if (!position) {
      setSaveMessage("Aún no hay ubicación disponible.");
      return;
    }

    try {
      setIsRouting(true);
      setSaveMessage("");

      if (isDemoMode) {
        const fixedDemoDestinationIndex = DEMO_ROUTE.length - 1;
        const fixedDemoDestination = DEMO_ROUTE[fixedDemoDestinationIndex];
        const currentIndex = demoIndexRef.current;

        demoDestinationIndexRef.current = fixedDemoDestinationIndex;
        setDestination(fixedDemoDestination);

        const simulatedRoute = buildDemoNavigationRoute(
          currentIndex,
          fixedDemoDestinationIndex
        );
        const simulatedDistance = getPathDistance(simulatedRoute);
        const simulatedDurationSeconds = simulatedDistance / (DEMO_SPEED_KMH / 3.6);
        const simulatedSteps = buildDemoSteps(simulatedRoute);

        setNavRoute(simulatedRoute);
        setNavDistance(simulatedDistance);
        setNavDuration(simulatedDurationSeconds);
        setNavSteps(simulatedSteps);
        setIsDrivingMode(true);
        setSaveMessage("Ruta demo calculada correctamente.");
        return;
      }

      const fixedDestination: Position = [9.9355, -84.0796];
      setDestination(fixedDestination);
      lastRouteTimeRef.current = Date.now();

      const result = await getDrivingRoute(position, fixedDestination);

      setNavRoute(result.coordinates);
      setNavDistance(result.distanceMeters);
      setNavDuration(result.durationSeconds);
      setNavSteps(result.steps);
      setIsDrivingMode(true);
      setSaveMessage("Ruta calculada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo calcular la ruta.";
      setSaveMessage(message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleMapClick = async (dest: Position) => {
    if (!position) {
      setSaveMessage("Aún no hay ubicación disponible.");
      return;
    }

    try {
      setIsRouting(true);
      setSaveMessage("");

      if (isDemoMode) {
        const currentIndex = demoIndexRef.current;
        const destinationIndex = findNearestDemoIndex(dest);
        const demoDestination = DEMO_ROUTE[destinationIndex];

        demoDestinationIndexRef.current = destinationIndex;
        setDestination(demoDestination);

        const simulatedRoute = buildDemoNavigationRoute(
          currentIndex,
          destinationIndex
        );
        const simulatedDistance = getPathDistance(simulatedRoute);
        const simulatedDurationSeconds = simulatedDistance / (DEMO_SPEED_KMH / 3.6);
        const simulatedSteps = buildDemoSteps(simulatedRoute);

        setNavRoute(simulatedRoute);
        setNavDistance(simulatedDistance);
        setNavDuration(simulatedDurationSeconds);
        setNavSteps(simulatedSteps);
        setIsDrivingMode(true);
        setSaveMessage("Ruta demo calculada correctamente.");
        return;
      }

      setDestination(dest);
      lastRouteTimeRef.current = Date.now();

      const result = await getDrivingRoute(position, dest);

      setNavRoute(result.coordinates);
      setNavDistance(result.distanceMeters);
      setNavDuration(result.durationSeconds);
      setNavSteps(result.steps);
      setIsDrivingMode(true);
      setSaveMessage("Ruta calculada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error calculando ruta.";
      setSaveMessage(message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleClearNavigation = () => {
    setNavRoute([]);
    setNavDistance(0);
    setNavDuration(0);
    setNavSteps([]);
    setDestination(null);
    setIsDrivingMode(false);
    demoDestinationIndexRef.current = null;
  };

  return (
    <div className="relative h-full w-full">
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
        <FollowUser position={position} active={!!destination} />
        <MapClickHandler onClick={handleMapClick} />

        <CircleMarker
          center={currentCenter}
          radius={10}
          pathOptions={{ color: isDemoMode ? "#f59e0b" : "#27AE60" }}
        >
          <Popup>
            {isDemoMode ? "Ubicación simulada (modo demo)" : "Tu ubicación actual"}
          </Popup>
        </CircleMarker>

        {destination && (
          <CircleMarker
            center={destination}
            radius={10}
            pathOptions={{ color: "#F59E0B" }}
          >
            <Popup>
              {isDemoMode ? "Destino demo seleccionado" : "Destino seleccionado"}
            </Popup>
          </CircleMarker>
        )}

        {route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: "#2D9CDB" }} />
        )}

        {navRoute.length > 1 && (
          <Polyline positions={navRoute} pathOptions={{ color: "#F59E0B" }} />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Estado
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRecording
                    ? "bg-[#27AE60] shadow-[0_0_12px_rgba(39,174,96,0.8)]"
                    : isDemoMode
                    ? "bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                    : "bg-[#2D9CDB] shadow-[0_0_12px_rgba(45,156,219,0.8)]"
                }`}
              />
              <p className="text-sm font-medium text-white">
                {isRecording
                  ? "Grabando recorrido"
                  : isDemoMode
                  ? "Modo demo activo"
                  : "GPS activo"}
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={handleToggleDemoMode}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-md transition ${
                isDemoMode
                  ? "border-[#f59e0b]/30 bg-[#f59e0b]/20 text-[#ffd08a]"
                  : "border-white/10 bg-black/45 text-white/85 hover:bg-black/55"
              }`}
            >
              {isDemoMode ? "Desactivar demo" : "Modo demo"}
            </button>

            <button
              onClick={handleStartNavigation}
              className="rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur-md transition hover:bg-black/55"
            >
              {isRouting ? "Calculando..." : "Probar navegación"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute left-4 right-4 top-24 z-[950] rounded-2xl border border-red-400/20 bg-red-500/15 px-4 py-3 text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="absolute left-4 right-4 top-24 z-[950] rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200 backdrop-blur-md">
          {saveMessage}
        </div>
      )}

      {!isDrivingMode && (
        <>
          <div className="absolute left-4 right-4 top-40 z-[900] text-center text-xs text-white/65">
            {isDemoMode
              ? "Modo demo: toca el mapa para probar navegación simulada 🚗"
              : "Toca el mapa para elegir un destino 📍"}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-[900] p-4">
            <div className="rounded-[28px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              {currentStep && (
                <div className="mb-4 rounded-2xl bg-[#F59E0B]/16 p-4 text-white">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                    Instrucción actual
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    {currentStep.instruction}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm text-white/75">
                    <span>{Math.max(1, Math.round(currentStep.distance))} m</span>
                    <span>{formatNavMinutes(currentStep.duration)} min</span>
                  </div>

                  {nextStep && (
                    <p className="mt-3 text-xs text-white/60">
                      Después: {nextStep.instruction}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/6 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-white/45">
                    Tiempo
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {formatElapsedTime(elapsedTime)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/6 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-white/45">
                    Distancia
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {(distance / 1000).toFixed(2)} km
                  </p>
                </div>

                <div className="rounded-2xl bg-white/6 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-white/45">
                    Velocidad
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {(speed * 3.6).toFixed(1)} km/h
                  </p>
                </div>
              </div>

              {navRoute.length > 0 && (
                <div className="mt-4 rounded-2xl bg-[#F59E0B]/12 p-3 text-sm text-white/90">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      Ruta estimada: {(navDistance / 1000).toFixed(2)} km ·{" "}
                      {Math.ceil(navDuration / 60)} min
                      {isDemoMode ? " · demo" : ""}
                    </span>

                    <button
                      onClick={handleClearNavigation}
                      className="rounded-xl bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleToggleRecording}
                className={`mt-4 w-full rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition ${
                  isRecording
                    ? "bg-[#27AE60] hover:bg-[#229954]"
                    : "bg-[#2D9CDB] hover:bg-[#238ac7]"
                }`}
              >
                {isRecording ? "Detener grabación" : "Iniciar grabación"}
              </button>

              <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                <span>secure: {String(secureInfo.secure)}</span>
                <span>geo: {String(secureInfo.geo)}</span>
                <span>demo: {String(isDemoMode)}</span>
                <span>puntos: {route.length}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {isDrivingMode && (
        <div className="absolute inset-0 z-[1200] flex flex-col justify-between bg-black/80 p-6 backdrop-blur-xl">
          <div className="mt-10 text-center text-white">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Navegando
            </p>

            <h1 className="mt-4 text-3xl font-bold">
              {currentStep?.instruction ?? "Sigue la ruta"}
            </h1>

            {currentStep && (
              <p className="mt-3 text-lg text-white/70">
                {Math.round(currentStep.distance)} m
              </p>
            )}

            {nextStep && (
              <p className="mt-4 text-sm text-white/50">
                Después: {nextStep.instruction}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-white/10 p-4 text-center text-white">
              <p className="text-sm text-white/60">Tiempo restante</p>
              <p className="text-xl font-semibold">
                {Math.ceil(navDuration / 60)} min
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center text-white">
              <p className="text-sm text-white/60">Distancia</p>
              <p className="text-xl font-semibold">
                {(navDistance / 1000).toFixed(2)} km
              </p>
            </div>

            <button
              onClick={handleClearNavigation}
              className="w-full rounded-2xl bg-red-500/80 p-4 font-semibold text-white"
            >
              Finalizar navegación
            </button>
          </div>
        </div>
      )}

      {isSaveModalOpen && (
        <div className="absolute inset-0 z-[1300] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#141a22] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Guardar ruta
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Nombre del recorrido
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Asigna un nombre para encontrar esta ruta más fácilmente después.
            </p>

            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              placeholder="Ej. Ruta a Cartago"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#2D9CDB]/50"
              autoFocus
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={handleCancelSave}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveTrip}
                disabled={isSaving}
                className="rounded-2xl bg-[#2D9CDB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#238ac7] disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : "Guardar ruta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
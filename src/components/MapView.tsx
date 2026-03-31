"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { divIcon } from "leaflet";
import SearchBar from "@/components/map/SearchBar";
import NavigationPanel from "@/components/map/NavigationPanel";
import DevPanel from "@/components/map/DevPanel";
import { saveTrip } from "@/lib/trips";
import { saveTripToCloud } from "@/lib/trips-cloud";
import { getCurrentUser } from "@/lib/auth";
import { PlaceResult } from "@/lib/geo";
import {
  DEMO_ROUTE,
  getBearing,
  getPathDistance,
} from "@/lib/map-utils";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { useTripRecording } from "@/hooks/useTripRecording";
import { useNavigation } from "@/hooks/useNavigation";
import { Position } from "@/types/trip";

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

    map.setView(position, 18, {
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
  const searchParams = useSearchParams();

  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  const {
    isRecording,
    route,
    elapsedTime,
    distance,
    speed,
    startRecording,
    stopRecording,
    pushPosition,
    resetRecordingStats,
  } = useTripRecording();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    searchError,
    setSearchError,
    isSearchOpen,
    setIsSearchOpen,
  } = usePlaceSearch(false);

  const {
    navRoute,
    navDistance,
    navDuration,
    isRouting,
    destination,
    isDrivingMode,
    isFollowingSavedTrip,
    activeSavedTrip,
    currentStep,
    nextStep,
    passedRoute,
    remainingRoute,
    calculateRouteToDestination,
    startFixedNavigation,
    clearNavigation,
    setDemoIndex,
    clearSavedTripState,
    resetNavigationForModeChange,
  } = useNavigation({
    position,
    isDemoMode,
    searchParams,
    setSearchQuery,
    setSearchResults,
    setIsSearchOpen,
    setSearchError,
    setSaveMessage,
  });

  const isDevEnvironment = process.env.NODE_ENV !== "production";

  const defaultCenter: Position = [9.9281, -84.0907];
  const currentCenter = position ?? defaultCenter;

  const heading = useMemo(() => {
    if (remainingRoute.length > 1) {
      return getBearing(remainingRoute[0], remainingRoute[1]);
    }

    if (route.length > 1) {
      return getBearing(route[route.length - 2], route[route.length - 1]);
    }

    return 0;
  }, [remainingRoute, route]);

  const navigationMarkerIcon = useMemo(
    () =>
      divIcon({
        className: "tripo-navigation-marker",
        html: `
          <div class="tripo-nav-pulse"></div>
          <div class="tripo-nav-arrow-wrapper" style="transform: rotate(${heading}deg);">
            <div class="tripo-nav-arrow"></div>
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      }),
    [heading]
  );

  useEffect(() => {
    if (!saveMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSaveMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveMessage]);

  useEffect(() => {
    if (!error) return;

    const timeoutId = window.setTimeout(() => {
      setError("");
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [error]);

  useEffect(() => {
    if (isDemoMode) return;

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        setError("");
        pushPosition(newPos);
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
  }, [isDemoMode, pushPosition]);

  useEffect(() => {
    if (!isDemoMode) return;

    setError("");
    setDemoIndex(0);
    setPosition(DEMO_ROUTE[0]);

    let idx = 0;
    const intervalId = window.setInterval(() => {
      idx += 1;

      if (idx >= DEMO_ROUTE.length) {
        idx = 0;
      }

      setDemoIndex(idx);
      const nextPos = DEMO_ROUTE[idx];
      setPosition(nextPos);
      pushPosition(nextPos);
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDemoMode, pushPosition, setDemoIndex]);

  const secureInfo = useMemo(() => {
    if (typeof window === "undefined") {
      return { secure: false, geo: false };
    }

    return {
      secure: window.isSecureContext,
      geo: !!navigator.geolocation,
    };
  }, []);

  const handleSelectSearchResult = async (result: PlaceResult) => {
    const dest: Position = [result.lat, result.lng];

    setSearchQuery(result.name);
    setSearchResults([]);
    setSearchError("");
    setIsSearchOpen(false);

    await calculateRouteToDestination(dest);
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording(position);
      setSaveMessage("");
      return;
    }

    stopRecording();
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
    resetRecordingStats();
    setError("");
    setSaveMessage("");
    setIsSaveModalOpen(false);
    setTripTitle("");
    clearSavedTripState();
    resetNavigationForModeChange();
    setIsDemoMode((prev) => !prev);
  };

  return (
    <div className="relative h-full w-full">
      <style>{`
        .tripo-navigation-marker {
          background: transparent;
          border: none;
        }

        .tripo-nav-pulse {
          position: absolute;
          inset: 5px;
          border-radius: 9999px;
          background: rgba(45, 156, 219, 0.18);
          box-shadow: 0 0 0 1px rgba(45, 156, 219, 0.18);
          animation: tripoPulse 1.8s ease-out infinite;
        }

        .tripo-nav-arrow-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 220ms ease;
        }

        .tripo-nav-arrow {
          width: 0;
          height: 0;
          border-left: 11px solid transparent;
          border-right: 11px solid transparent;
          border-bottom: 24px solid #2d9cdb;
          filter: drop-shadow(0 4px 10px rgba(45, 156, 219, 0.45));
        }

        @keyframes tripoPulse {
          0% {
            transform: scale(0.8);
            opacity: 0.75;
          }
          70% {
            transform: scale(1.25);
            opacity: 0;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }
      `}</style>

      <MapContainer
        center={currentCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />

        <ZoomControl position="bottomright" />
        <RecenterMap center={currentCenter} />
        <FollowUser position={position} active={isDrivingMode} />
        <MapClickHandler onClick={calculateRouteToDestination} />

        {isDrivingMode && position ? (
          <Marker position={position} icon={navigationMarkerIcon}>
            <Popup>Tu posición actual</Popup>
          </Marker>
        ) : (
          <CircleMarker
            center={currentCenter}
            radius={10}
            pathOptions={{ color: isDemoMode ? "#f59e0b" : "#27AE60" }}
          >
            <Popup>
              {isDemoMode ? "Ubicación simulada (modo demo)" : "Tu ubicación actual"}
            </Popup>
          </CircleMarker>
        )}

        {destination && (
          <CircleMarker
            center={destination}
            radius={10}
            pathOptions={{ color: "#F59E0B" }}
          >
            <Popup>
              {isDemoMode
                ? "Destino demo seleccionado"
                : isFollowingSavedTrip
                ? "Final de la ruta guardada"
                : "Destino seleccionado"}
            </Popup>
          </CircleMarker>
        )}

        {route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#2D9CDB", weight: 5, opacity: 0.85 }}
          />
        )}

        {passedRoute.length > 1 && (
          <Polyline
            positions={passedRoute}
            pathOptions={{ color: "#2D9CDB", weight: 7, opacity: 0.95 }}
          />
        )}

        {remainingRoute.length > 1 && (
          <Polyline
            positions={remainingRoute}
            pathOptions={{ color: "#F59E0B", weight: 7, opacity: 0.95 }}
          />
        )}
      </MapContainer>

      {!isDrivingMode && (
        <SearchBar
          value={searchQuery}
          results={searchResults}
          isSearching={isSearching}
          error={searchError}
          isOpen={isSearchOpen}
          onChange={setSearchQuery}
          onOpen={() => setIsSearchOpen(true)}
          onClose={() => setIsSearchOpen(false)}
          onSelect={handleSelectSearchResult}
        />
      )}

      {isDevEnvironment && (
        <DevPanel
          isOpen={isDevPanelOpen}
          isRecording={isRecording}
          isDemoMode={isDemoMode}
          isRouting={isRouting}
          secure={secureInfo.secure}
          geo={secureInfo.geo}
          onToggleOpen={() => setIsDevPanelOpen((prev) => !prev)}
          onToggleDemoMode={handleToggleDemoMode}
          onStartNavigation={startFixedNavigation}
        />
      )}

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

      <NavigationPanel
        isDrivingMode={isDrivingMode}
        isFollowingSavedTrip={isFollowingSavedTrip}
        activeSavedTrip={activeSavedTrip}
        currentStep={currentStep}
        nextStep={nextStep}
        navDuration={navDuration}
        navDistance={navDistance}
        remainingRouteDistance={getPathDistance(remainingRoute)}
        elapsedTime={elapsedTime}
        distance={distance}
        speed={speed}
        isRecording={isRecording}
        isDemoMode={isDemoMode}
        navRouteLength={navRoute.length}
        onToggleRecording={handleToggleRecording}
        onClearNavigation={clearNavigation}
      />

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

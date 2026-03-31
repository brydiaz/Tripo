"use client";

import { NavigationStep } from "@/lib/routing";
import { formatElapsedTime, formatNavMinutes, getPathDistance } from "@/lib/map-utils";
import { SavedTrip } from "@/types/trip";

type NavigationPanelProps = {
  isDrivingMode: boolean;
  isFollowingSavedTrip: boolean;
  activeSavedTrip: SavedTrip | null;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  navDuration: number;
  navDistance: number;
  remainingRouteDistance: number;
  elapsedTime: number;
  distance: number;
  speed: number;
  isRecording: boolean;
  isDemoMode: boolean;
  navRouteLength: number;
  onToggleRecording: () => void;
  onClearNavigation: () => void;
};

export default function NavigationPanel({
  isDrivingMode,
  isFollowingSavedTrip,
  activeSavedTrip,
  currentStep,
  nextStep,
  navDuration,
  navDistance,
  remainingRouteDistance,
  elapsedTime,
  distance,
  speed,
  isRecording,
  isDemoMode,
  navRouteLength,
  onToggleRecording,
  onClearNavigation,
}: NavigationPanelProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] p-4">
      {isDrivingMode ? (
        <div className="relative">
          <div className="rounded-[28px] border border-white/10 bg-black/55 p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
              {isFollowingSavedTrip ? "Ruta guardada activa" : "Navegación activa"}
            </p>

            <h2 className="mt-2 text-lg font-bold text-white">
              {isFollowingSavedTrip && activeSavedTrip
                ? activeSavedTrip.title
                : currentStep?.instruction ?? "Sigue la ruta"}
            </h2>

            <p className="mt-1 text-sm text-white/70">
              {isFollowingSavedTrip
                ? `${Math.round(remainingRouteDistance)} m restantes`
                : currentStep
                ? `${Math.round(currentStep.distance)} m`
                : "Sigue avanzando"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-center text-white">
                <p className="text-xs text-white/55">Tiempo restante</p>
                <p className="mt-1 text-base font-semibold">
                  {isFollowingSavedTrip
                    ? `${formatNavMinutes(
                        remainingRouteDistance /
                          (Math.max(activeSavedTrip?.avgSpeedKmh ?? 30, 5) / 3.6)
                      )} min`
                    : `${Math.ceil(navDuration / 60)} min`}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 text-center text-white">
                <p className="text-xs text-white/55">Distancia</p>
                <p className="mt-1 text-base font-semibold">
                  {(
                    (isFollowingSavedTrip
                      ? remainingRouteDistance
                      : navDistance) / 1000
                  ).toFixed(2)}{" "}
                  km
                </p>
              </div>
            </div>

            {nextStep && !isFollowingSavedTrip && (
              <p className="mt-3 text-xs text-white/55">
                Después: {nextStep.instruction}
              </p>
            )}

            {isFollowingSavedTrip && (
              <p className="mt-3 text-xs text-white/55">
                Sigue el trazo naranja para repetir exactamente tu recorrido guardado.
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={onToggleRecording}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                  isRecording
                    ? "bg-[#27AE60] hover:bg-[#229954]"
                    : "bg-[#2D9CDB] hover:bg-[#238ac7]"
                }`}
              >
                {isRecording ? "● Grabando" : "Grabar Ruta"}
              </button>

              <button
                onClick={onClearNavigation}
                className="rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-semibold text-white"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      ) : (
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

          {navRouteLength > 0 && (
            <div className="mt-4 rounded-2xl bg-[#F59E0B]/12 p-3 text-sm text-white/90">
              <div className="flex items-center justify-between gap-3">
                <span>
                  Ruta estimada: {(navDistance / 1000).toFixed(2)} km ·{" "}
                  {Math.ceil(navDuration / 60)} min
                  {isDemoMode ? " · demo" : ""}
                </span>

                <button
                  onClick={onClearNavigation}
                  className="rounded-xl bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onToggleRecording}
            className={`mt-4 w-full rounded-2xl px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition ${
              isRecording
                ? "bg-[#27AE60] hover:bg-[#229954]"
                : "bg-[#2D9CDB] hover:bg-[#238ac7]"
            }`}
          >
            {isRecording ? "Detener grabación" : "Iniciar grabación"}
          </button>
        </div>
      )}
    </div>
  );
}

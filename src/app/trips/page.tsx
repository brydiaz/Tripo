"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAllTrips, deleteTripById, getSavedTrips } from "@/lib/trips";
import TripPreview from "@/components/TripPreview";
import { SavedTrip } from "@/types/trip";

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    setTrips(getSavedTrips());
  }, []);

  const handleDeleteTrip = (id: string, title: string) => {
    const confirmed = window.confirm(`¿Eliminar la ruta "${title}"?`);
    if (!confirmed) return;

    deleteTripById(id);
    setTrips(getSavedTrips());
  };

  const handleClearAll = () => {
    const confirmed = window.confirm("¿Seguro que deseas borrar todo el historial?");
    if (!confirmed) return;

    clearAllTrips();
    setTrips([]);
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Historial
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#2D9CDB]">Mis rutas</h1>
            <p className="mt-1 text-sm text-white/60">
              Guardadas en este dispositivo
            </p>
          </div>

          <div className="flex gap-2">
            {trips.length > 0 && (
              <button
                onClick={handleClearAll}
                className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
              >
                Vaciar
              </button>
            )}

            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              Volver
            </Link>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#141a22] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <p className="text-base font-medium text-white/85">
              Aún no has guardado rutas
            </p>
            <p className="mt-2 text-sm text-white/55">
              Graba un recorrido desde la pantalla principal y aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-[28px] border border-white/10 bg-[#141a22] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col gap-4">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block transition hover:opacity-95"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{trip.title}</h2>
                        <p className="mt-1 text-sm text-white/55">
                          {new Date(trip.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#2D9CDB]/10 px-3 py-1 text-xs font-medium text-[#77c3ee]">
                        {trip.points.length} puntos
                      </div>
                    </div>

                    <div className="mt-4">
                      <TripPreview points={trip.points} height={96} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/45">
                          Tiempo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {formatDuration(trip.durationMs)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/45">
                          Distancia
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {(trip.distanceMeters / 1000).toFixed(2)} km
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/45">
                          Promedio
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {trip.avgSpeedKmh.toFixed(1)} km/h
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteTrip(trip.id, trip.title)}
                      className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
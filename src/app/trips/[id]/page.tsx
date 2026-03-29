"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteTripById, getTripById } from "@/lib/trips";
import { SavedTrip } from "@/types/trip";
import TripDetailMapClient from "@/components/TripDetailMapClient";

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

type TripDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [tripId, setTripId] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadParamsAndTrip() {
      const resolvedParams = await params;
      setTripId(resolvedParams.id);

      const foundTrip = getTripById(resolvedParams.id);
      setTrip(foundTrip);
    }

    loadParamsAndTrip();
  }, [params]);

  const handleDeleteTrip = () => {
    if (!trip) return;

    const confirmed = window.confirm(`¿Eliminar la ruta "${trip.title}"?`);

    if (!confirmed) return;

    deleteTripById(trip.id);
    router.push("/trips");
  };

  if (!tripId) {
    return (
      <main className="min-h-screen bg-[#0B0F14] px-6 py-6 text-white">
        <div className="mx-auto max-w-md">Cargando ruta...</div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#0B0F14] px-6 py-6 text-white">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#2D9CDB]">Ruta no encontrada</h1>
            <Link
              href="/trips"
              className="rounded-2xl bg-[#1A1F26] px-4 py-2 text-sm text-white/80"
            >
              Volver
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1A1F26] p-5 text-white/70">
            No existe una ruta guardada con ese identificador.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] px-6 py-6 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2D9CDB]">{trip.title}</h1>
            <p className="text-sm text-white/60">
              {new Date(trip.createdAt).toLocaleString()}
            </p>
          </div>

          <Link
            href="/trips"
            className="rounded-2xl bg-[#1A1F26] px-4 py-2 text-sm text-white/80"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#1A1F26] p-4">
            <p className="text-xs text-white/50">Tiempo</p>
            <p className="mt-2 text-base font-semibold">
              {formatDuration(trip.durationMs)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#1A1F26] p-4">
            <p className="text-xs text-white/50">Distancia</p>
            <p className="mt-2 text-base font-semibold">
              {(trip.distanceMeters / 1000).toFixed(2)} km
            </p>
          </div>

          <div className="rounded-2xl bg-[#1A1F26] p-4">
            <p className="text-xs text-white/50">Promedio</p>
            <p className="mt-2 text-base font-semibold">
              {trip.avgSpeedKmh.toFixed(1)} km/h
            </p>
          </div>
        </div>

        <div className="h-[70vh] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <TripDetailMapClient points={trip.points} />
        </div>

        <button
          onClick={handleDeleteTrip}
          className="w-full rounded-2xl bg-red-500/15 px-5 py-4 text-base font-semibold text-red-300"
        >
          Eliminar ruta
        </button>
      </div>
    </main>
  );
}
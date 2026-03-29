"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SavedTrip } from "@/types/trip";
import TripDetailMapClient from "@/components/TripDetailMapClient";
import Modal from "@/components/Modal";
import {
  deleteTripFromCloud,
  getTripByIdFromCloud,
  renameTripInCloud,
} from "@/lib/trips-cloud";

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
  params: Promise<{ id: string }>;
};

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [tripId, setTripId] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadTrip() {
      const resolvedParams = await params;
      setTripId(resolvedParams.id);
      const foundTrip = await getTripByIdFromCloud(resolvedParams.id);
      setTrip(foundTrip);
    }

    loadTrip();
  }, [params]);

  const handleRename = async () => {
    if (!trip) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    await renameTripInCloud(trip.id, trimmed);
    const updated = await getTripByIdFromCloud(trip.id);
    setTrip(updated);
    setRenameOpen(false);
  };

  const handleDelete = async () => {
    if (!trip) return;
    await deleteTripFromCloud(trip.id);
    router.push("/trips");
  };

  if (!tripId) {
    return <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">Cargando ruta...</main>;
  }

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">
        <div className="mx-auto max-w-md">Ruta no encontrada.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Detalle de ruta
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#2D9CDB]">{trip.title}</h1>
            <p className="mt-1 text-sm text-white/55">
              {new Date(trip.createdAt).toLocaleString()}
            </p>
          </div>

          <Link
            href="/trips"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-white/10 bg-[#141a22] p-4">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Tiempo</p>
            <p className="mt-2 text-base font-semibold text-white">
              {formatDuration(trip.durationMs)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141a22] p-4">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Distancia</p>
            <p className="mt-2 text-base font-semibold text-white">
              {(trip.distanceMeters / 1000).toFixed(2)} km
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141a22] p-4">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Promedio</p>
            <p className="mt-2 text-base font-semibold text-white">
              {trip.avgSpeedKmh.toFixed(1)} km/h
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#141a22]">
          <div className="h-[70vh] w-full">
            <TripDetailMapClient points={trip.points} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setNewTitle(trip.title);
              setRenameOpen(true);
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base font-semibold text-white/85"
          >
            Renombrar
          </button>

          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-base font-semibold text-red-300"
          >
            Eliminar ruta
          </button>
        </div>
      </div>

      <Modal
        isOpen={renameOpen}
        title="Renombrar ruta"
        onClose={() => setRenameOpen(false)}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full rounded-xl bg-white/5 p-3 text-white"
        />
        <button
          onClick={handleRename}
          className="mt-4 w-full rounded-xl bg-[#2D9CDB] p-3"
        >
          Guardar cambios
        </button>
      </Modal>

      <Modal
        isOpen={deleteOpen}
        title="Eliminar ruta"
        description="Esta acción no se puede deshacer."
        onClose={() => setDeleteOpen(false)}
      >
        <button
          onClick={handleDelete}
          className="w-full rounded-xl bg-red-500/20 p-3 text-red-300"
        >
          Eliminar
        </button>
      </Modal>
    </main>
  );
}
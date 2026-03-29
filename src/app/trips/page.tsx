"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TripPreview from "@/components/TripPreview";
import Modal from "@/components/Modal";
import { SavedTrip } from "@/types/trip";
import {
  deleteTripFromCloud,
  getMyTripsFromCloud,
  renameTripInCloud,
} from "@/lib/trips-cloud";
import { getCurrentUser } from "@/lib/auth";

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
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setMessage("");

      const user = await getCurrentUser();
      if (!user) {
        setTrips([]);
        setMessage("Debes iniciar sesión para ver tus rutas.");
        return;
      }

      const cloudTrips = await getMyTripsFromCloud();
      setTrips(cloudTrips);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudieron cargar las rutas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const openRename = (trip: SavedTrip) => {
    setSelectedTrip(trip);
    setNewTitle(trip.title);
    setRenameOpen(true);
  };

  const confirmRename = async () => {
    if (!selectedTrip) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    await renameTripInCloud(selectedTrip.id, trimmed);
    setRenameOpen(false);
    setSelectedTrip(null);
    await loadTrips();
  };

  const openDelete = (trip: SavedTrip) => {
    setSelectedTrip(trip);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTrip) return;

    await deleteTripFromCloud(selectedTrip.id);
    setDeleteOpen(false);
    setSelectedTrip(null);
    await loadTrips();
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Historial
            </p>
            <h1 className="text-3xl font-bold text-[#2D9CDB]">Mis rutas</h1>
          </div>

          <Link href="/" className="rounded-2xl bg-white/5 px-4 py-2 text-sm">
            Volver
          </Link>
        </div>

        {message && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#141a22] p-6 text-white/60">
            Cargando rutas...
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#141a22] p-6 text-white/60">
            No tienes rutas guardadas en la nube.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-[28px] border border-white/10 bg-[#141a22] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col gap-4">
                  <Link href={`/trips/${trip.id}`} className="block">
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

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openRename(trip)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
                    >
                      Renombrar
                    </button>

                    <button
                      onClick={() => openDelete(trip)}
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
          onClick={confirmRename}
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
          onClick={confirmDelete}
          className="w-full rounded-xl bg-red-500/20 p-3 text-red-300"
        >
          Eliminar
        </button>
      </Modal>
    </main>
  );
}
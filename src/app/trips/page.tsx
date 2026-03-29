"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearAllTrips,
  deleteTripById,
  getSavedTrips,
  renameTripById,
} from "@/lib/trips";
import TripPreview from "@/components/TripPreview";
import Modal from "@/components/Modal";
import { SavedTrip } from "@/types/trip";

export default function TripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    setTrips(getSavedTrips());
  }, []);

  const refresh = () => setTrips(getSavedTrips());

  // -------- RENAME --------
  const openRename = (trip: SavedTrip) => {
    setSelectedTrip(trip);
    setNewTitle(trip.title);
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (!selectedTrip) return;

    const trimmed = newTitle.trim();
    if (!trimmed) return;

    renameTripById(selectedTrip.id, trimmed);
    setRenameOpen(false);
    setSelectedTrip(null);
    refresh();
  };

  // -------- DELETE --------
  const openDelete = (trip: SavedTrip) => {
    setSelectedTrip(trip);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedTrip) return;

    deleteTripById(selectedTrip.id);
    setDeleteOpen(false);
    setSelectedTrip(null);
    refresh();
  };

  // -------- CLEAR --------
  const confirmClear = () => {
    clearAllTrips();
    setTrips([]);
    setClearOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] px-5 py-6 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Historial
            </p>
            <h1 className="text-3xl font-bold text-[#2D9CDB]">Mis rutas</h1>
          </div>

          <div className="flex gap-2">
            {trips.length > 0 && (
              <button
                onClick={() => setClearOpen(true)}
                className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-300"
              >
                Vaciar
              </button>
            )}

            <Link href="/" className="rounded-2xl bg-white/5 px-4 py-2 text-sm">
              Volver
            </Link>
          </div>
        </div>

        {/* LISTA */}
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="rounded-3xl bg-[#141a22] p-4 border border-white/10"
          >
            <Link href={`/trips/${trip.id}`}>
              <h2 className="font-semibold">{trip.title}</h2>
            </Link>

            <div className="mt-3">
              <TripPreview points={trip.points} height={90} />
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => openRename(trip)}
                className="bg-white/5 px-3 py-2 rounded-xl text-sm"
              >
                Renombrar
              </button>

              <button
                onClick={() => openDelete(trip)}
                className="bg-red-500/10 px-3 py-2 rounded-xl text-sm text-red-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RENOMBRAR */}
      <Modal
        isOpen={renameOpen}
        title="Renombrar ruta"
        onClose={() => setRenameOpen(false)}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full bg-white/5 p-3 rounded-xl mt-3"
        />

        <button
          onClick={confirmRename}
          className="mt-4 w-full bg-[#2D9CDB] p-3 rounded-xl"
        >
          Guardar cambios
        </button>
      </Modal>

      {/* MODAL ELIMINAR */}
      <Modal
        isOpen={deleteOpen}
        title="Eliminar ruta"
        description="Esta acción no se puede deshacer."
        onClose={() => setDeleteOpen(false)}
      >
        <button
          onClick={confirmDelete}
          className="w-full bg-red-500/20 p-3 rounded-xl text-red-300"
        >
          Eliminar
        </button>
      </Modal>

      {/* MODAL CLEAR */}
      <Modal
        isOpen={clearOpen}
        title="Vaciar historial"
        description="Se eliminarán todas las rutas."
        onClose={() => setClearOpen(false)}
      >
        <button
          onClick={confirmClear}
          className="w-full bg-red-500/20 p-3 rounded-xl text-red-300"
        >
          Borrar todo
        </button>
      </Modal>
    </main>
  );
}
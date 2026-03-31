"use client";

import Link from "next/link";
import MapClient from "@/components/MapClient";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth";
import { useEffect, useState } from "react";
import { getSavedTrips } from "@/lib/trips";
import { migrateLocalTripsToCloud } from "@/lib/migrateTrips";

export default function HomePage() {
  const { user, loading } = useUser();

  const [hasLocalTrips, setHasLocalTrips] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState("");

  useEffect(() => {
    const local = getSavedTrips();
    setHasLocalTrips(local.length > 0);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setMigrationMessage("");

      const result = await migrateLocalTripsToCloud();

      setMigrationMessage(`Se migraron ${result.migrated} rutas a la nube ☁️`);
      setHasLocalTrips(false);
    } catch (error) {
      setMigrationMessage("Error al migrar rutas");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-6">
        <header className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              GPS Tracker
            </p>
            <h1 className="text-3xl font-bold text-[#2D9CDB]">Tripo</h1>

            <Link
              href="/trips"
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/15"
            >
              Ver rutas
            </Link>
          </div>

          <div className="flex flex-col items-end gap-2">
            {!loading && user && (
              <div className="text-xs text-white/60 max-w-[120px] truncate">
                {user.email}
              </div>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 backdrop-blur-md transition hover:bg-red-500/20"
              >
                Salir
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-[#2D9CDB]/30 bg-[#2D9CDB]/15 px-3 py-1.5 text-xs font-semibold text-[#8fd3ff] backdrop-blur-md transition hover:bg-[#2D9CDB]/25"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {user && hasLocalTrips && (
          <div className="mb-4 rounded-2xl border border-[#2D9CDB]/20 bg-[#2D9CDB]/10 p-4">
            <p className="text-sm text-white/80">
              Tienes rutas guardadas en este dispositivo 📱
            </p>

            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="mt-3 w-full rounded-xl bg-[#2D9CDB] px-4 py-3 text-sm font-semibold text-white hover:bg-[#238ac7] disabled:opacity-60"
            >
              {isMigrating ? "Migrando..." : "Subir a la nube ☁️"}
            </button>
          </div>
        )}

        {migrationMessage && (
          <div className="mb-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">
            {migrationMessage}
          </div>
        )}

        <section className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#11161d] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="h-[85vh] w-full">
            <MapClient />
          </div>
        </section>
      </div>
    </main>
  );
}
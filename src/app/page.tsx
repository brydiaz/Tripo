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

  // detectar rutas locales
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

        {/* HEADER */}
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              GPS Tracker
            </p>
            <h1 className="text-3xl font-bold text-[#2D9CDB]">Tripo</h1>
            <p className="text-sm text-white/60">Tu ruta, tu historia</p>
          </div>

          {/* USER */}
          <div className="flex flex-col items-end gap-2">
            {!loading && user && (
              <div className="text-xs text-white/60 max-w-[120px] truncate">
                {user.email}
              </div>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20"
              >
                Salir
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl bg-[#2D9CDB] px-3 py-2 text-xs text-white hover:bg-[#238ac7]"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {/* MIGRATION CARD */}
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

        {/* MIGRATION MESSAGE */}
        {migrationMessage && (
          <div className="mb-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">
            {migrationMessage}
          </div>
        )}

        {/* MAP */}
        <section className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#11161d] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="h-[78vh] w-full">
            <MapClient />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <Link
            href="/trips"
            className="text-sm text-white/80 hover:text-white"
          >
            Ver mis rutas
          </Link>

          <div className="text-xs text-white/40">
            {user ? "☁️ Guardando en nube" : "📱 Guardando local"}
          </div>
        </footer>
      </div>
    </main>
  );
}
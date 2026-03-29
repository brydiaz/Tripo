import Link from "next/link";
import MapClient from "@/components/MapClient";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F14] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              GPS Route Tracker
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2D9CDB]">
              Tripo
            </h1>
            <p className="mt-1 text-sm text-white/65">Tu ruta, tu historia</p>
          </div>

          <Link
            href="/trips"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-sm transition hover:bg-white/10"
          >
            Mis rutas
          </Link>
        </header>

        <section className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#11161d] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,156,219,0.12),_transparent_35%)] pointer-events-none z-10" />

          <div className="h-[78vh] w-full">
            <MapClient />
          </div>
        </section>

        <footer className="mt-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-sm font-medium text-white/90">Tripo MVP</p>
            <p className="text-xs text-white/50">Seguimiento y grabación de rutas</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1A1F26] text-lg shadow-lg">
            📍
          </div>
        </footer>
      </div>
    </main>
  );
}
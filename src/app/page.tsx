import Link from "next/link";
import MapClient from "@/components/MapClient";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F14] text-white p-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#2D9CDB]">
              Tripo
            </h1>
            <p className="text-sm text-white/70">Tu ruta, tu historia</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/trips"
              className="rounded-2xl bg-[#1A1F26] px-4 py-2 text-sm text-white/80"
            >
              Mis rutas
            </Link>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1F26] text-lg shadow-lg">
              📍
            </div>
          </div>
        </header>

        <div className="h-[70vh] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <MapClient />
        </div>
      </div>
    </main>
  );
}
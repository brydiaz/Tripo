import MapClient from "@/components/MapClient";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F14] text-white p-6">
      <h1 className="mb-4 text-3xl font-bold text-[#2D9CDB]">
        Tripo
      </h1>

      <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-white/10">
        <MapClient />
      </div>
    </main>
  );
}
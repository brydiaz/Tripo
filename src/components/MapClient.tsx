"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/60">
      Cargando mapa...
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
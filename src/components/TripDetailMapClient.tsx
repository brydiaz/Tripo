"use client";

import dynamic from "next/dynamic";
import { Position } from "@/types/trip";

const TripDetailMap = dynamic(() => import("./TripDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-white/60">
      Cargando mapa...
    </div>
  ),
});

type TripDetailMapClientProps = {
  points: Position[];
};

export default function TripDetailMapClient({
  points,
}: TripDetailMapClientProps) {
  return <TripDetailMap points={points} />;
}
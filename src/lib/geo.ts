import { Position } from "@/types/trip";
import { getDrivingRoute } from "@/lib/routing";

export type PlaceResult = {
  name: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    throw new Error("Falta NEXT_PUBLIC_MAPBOX_TOKEN");
  }

  const params = new URLSearchParams({
    access_token: token,
    limit: "5",
    country: "cr",
    language: "es",
  });

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error("Error buscando lugares");
  }

  const data = await res.json();

  return data.features.map((feature: any) => ({
    name: feature.place_name,
    lat: feature.center[1],
    lng: feature.center[0],
  }));
}

export async function getRoute(origin: Position, destination: Position) {
  return await getDrivingRoute(origin, destination);
}
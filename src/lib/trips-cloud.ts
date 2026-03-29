import { supabase } from "@/lib/supabase";
import { SavedTrip } from "@/types/trip";

type TripRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  duration_ms: number;
  distance_meters: number;
  avg_speed_kmh: number;
  points: [number, number][];
};

function mapRowToTrip(row: TripRow): SavedTrip {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    durationMs: row.duration_ms,
    distanceMeters: row.distance_meters,
    avgSpeedKmh: row.avg_speed_kmh,
    points: row.points,
  };
}

export async function saveTripToCloud(trip: SavedTrip) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("Debes iniciar sesión para guardar rutas.");
  }

  const { error } = await supabase.from("trips").insert({
    id: trip.id,
    user_id: user.id,
    title: trip.title,
    created_at: trip.createdAt,
    duration_ms: trip.durationMs,
    distance_meters: trip.distanceMeters,
    avg_speed_kmh: trip.avgSpeedKmh,
    points: trip.points,
  });

  if (error) {
    throw error;
  }
}

export async function getMyTripsFromCloud(): Promise<SavedTrip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as TripRow[]).map(mapRowToTrip);
}

export async function getTripByIdFromCloud(id: string): Promise<SavedTrip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRowToTrip(data as TripRow);
}

export async function renameTripInCloud(id: string, title: string) {
  const { error } = await supabase.from("trips").update({ title }).eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteTripFromCloud(id: string) {
  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
import { getSavedTrips, clearAllTrips } from "@/lib/trips";
import { saveTripToCloud } from "@/lib/trips-cloud";
import { getCurrentUser } from "@/lib/auth";

export async function migrateLocalTripsToCloud() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const localTrips = getSavedTrips();

  if (localTrips.length === 0) {
    return { migrated: 0 };
  }

  let migratedCount = 0;

  for (const trip of localTrips) {
    try {
      await saveTripToCloud(trip);
      migratedCount++;
    } catch (error) {
      console.error("Error migrando ruta:", trip.id, error);
    }
  }

  // limpiar local después de migrar
  clearAllTrips();

  return { migrated: migratedCount };
}
export type RoutePoint = [number, number];

export type NavigationStep = {
  instruction: string;
  distance: number;
  duration: number;
  type?: number;
  wayPoints: [number, number];
};

export type RouteResponse = {
  coordinates: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
  steps: NavigationStep[];
};

type OrsStep = {
  instruction: string;
  distance: number;
  duration: number;
  type?: number;
  way_points: [number, number];
};

type OrsSegment = {
  distance: number;
  duration: number;
  steps: OrsStep[];
};

type OrsFeature = {
  geometry: {
    coordinates: [number, number][];
  };
  properties: {
    summary: {
      distance: number;
      duration: number;
    };
    segments?: OrsSegment[];
  };
};

type OrsDirectionsResponse = {
  features: OrsFeature[];
};

export async function getDrivingRoute(
  start: RoutePoint,
  end: RoutePoint
): Promise<RouteResponse> {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;

  if (!apiKey) {
    throw new Error("Falta NEXT_PUBLIC_ORS_API_KEY en .env.local");
  }

  const response = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [start[1], start[0]],
          [end[1], end[0]],
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo calcular la ruta");
  }

  const data = (await response.json()) as OrsDirectionsResponse;
  const feature = data.features?.[0];

  if (!feature) {
    throw new Error("La API no devolvió una ruta válida");
  }

  const steps =
    feature.properties.segments?.flatMap((segment) =>
      segment.steps.map((step) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
        type: step.type,
        wayPoints: step.way_points,
      }))
    ) ?? [];

  return {
    coordinates: feature.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as RoutePoint
    ),
    distanceMeters: feature.properties.summary.distance,
    durationSeconds: feature.properties.summary.duration,
    steps,
  };
}
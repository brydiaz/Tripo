import { NavigationStep } from "@/lib/routing";
import { Position } from "@/types/trip";

export const DEMO_ROUTE: Position[] = [
  [9.9281, -84.0907],
  [9.9285, -84.0902],
  [9.929, -84.0896],
  [9.9296, -84.089],
  [9.9301, -84.0885],
  [9.9306, -84.088],
  [9.9311, -84.0874],
  [9.9315, -84.0868],
  [9.932, -84.0862],
  [9.9325, -84.0857],
  [9.933, -84.0852],
  [9.9334, -84.0847],
];

export const DEMO_SPEED_KMH = 35;

export function getDistance(p1: Position, p2: Position) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(p1[0]);
  const lat2 = toRad(p2[0]);
  const dLat = toRad(p2[0] - p1[0]);
  const dLng = toRad(p2[1] - p1[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function getPathDistance(points: Position[]) {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistance(points[i - 1], points[i]);
  }
  return total;
}

export function formatElapsedTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

export function formatNavMinutes(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60));
}

export function findNearestDemoIndex(target: Position) {
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  DEMO_ROUTE.forEach((point, index) => {
    const d = getDistance(point, target);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export function buildDemoNavigationRoute(startIndex: number, endIndex: number) {
  if (startIndex === endIndex) {
    return [DEMO_ROUTE[startIndex]];
  }

  if (startIndex < endIndex) {
    return DEMO_ROUTE.slice(startIndex, endIndex + 1);
  }

  return DEMO_ROUTE.slice(endIndex, startIndex + 1).reverse();
}

export function buildRouteSteps(
  routePoints: Position[],
  speedKmh: number,
  isRecordedRoute = false
): NavigationStep[] {
  if (routePoints.length < 2) return [];

  const effectiveSpeed = Math.max(speedKmh, 5);

  return routePoints.slice(1).map((point, index) => {
    const from = routePoints[index];
    const distance = getDistance(from, point);
    const duration = distance / (effectiveSpeed / 3.6);
    const isLast = index === routePoints.length - 2;

    return {
      instruction: isLast
        ? "Has llegado al final de la ruta"
        : isRecordedRoute
        ? `Sigue la ruta guardada (${index + 1})`
        : `Continúa hacia el siguiente punto (${index + 1})`,
      distance,
      duration,
      type: isLast ? 10 : 0,
      wayPoints: [index, index + 1],
    };
  });
}

export function findClosestRouteIndex(position: Position, navRoute: Position[]) {
  let closestIndex = 0;
  let closestDistance = Infinity;

  navRoute.forEach((point, index) => {
    const d = getDistance(position, point);
    if (d < closestDistance) {
      closestDistance = d;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export function getActiveStepIndex(
  position: Position | null,
  navRoute: Position[],
  steps: NavigationStep[]
) {
  if (!position || navRoute.length === 0 || steps.length === 0) {
    return 0;
  }

  const closestRouteIndex = findClosestRouteIndex(position, navRoute);

  const foundIndex = steps.findIndex(
    (step) => closestRouteIndex <= step.wayPoints[1]
  );

  return foundIndex === -1 ? steps.length - 1 : foundIndex;
}

export function getBearing(from: Position, to: Position) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getRoute } from "@/lib/geo";
import { getTripById } from "@/lib/trips";
import { getTripByIdFromCloud } from "@/lib/trips-cloud";
import {
  buildDemoNavigationRoute,
  buildRouteSteps,
  DEMO_ROUTE,
  DEMO_SPEED_KMH,
  findClosestRouteIndex,
  findNearestDemoIndex,
  getActiveStepIndex,
  getPathDistance,
} from "@/lib/map-utils";
import { NavigationStep } from "@/lib/routing";
import { Position, SavedTrip } from "@/types/trip";

type UseNavigationParams = {
  position: Position | null;
  isDemoMode: boolean;
  searchParams: URLSearchParams;
  setSearchQuery: (value: string) => void;
  setSearchResults: (results: any[]) => void;
  setIsSearchOpen: (open: boolean) => void;
  setSearchError: (value: string) => void;
  setSaveMessage: (value: string) => void;
};

export function useNavigation({
  position,
  isDemoMode,
  searchParams,
  setSearchQuery,
  setSearchResults,
  setIsSearchOpen,
  setSearchError,
  setSaveMessage,
}: UseNavigationParams) {
  const [navRoute, setNavRoute] = useState<Position[]>([]);
  const [navDistance, setNavDistance] = useState(0);
  const [navDuration, setNavDuration] = useState(0);
  const [navSteps, setNavSteps] = useState<NavigationStep[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [destination, setDestination] = useState<Position | null>(null);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [isFollowingSavedTrip, setIsFollowingSavedTrip] = useState(false);
  const [activeSavedTrip, setActiveSavedTrip] = useState<SavedTrip | null>(null);

  const demoDestinationIndexRef = useRef<number | null>(null);
  const demoIndexRef = useRef(0);
  const lastRouteTimeRef = useRef(0);
  const followedTripIdRef = useRef<string | null>(null);

  const activeStepIndex = useMemo(
    () => getActiveStepIndex(position, navRoute, navSteps),
    [position, navRoute, navSteps]
  );

  const currentStep = navSteps[activeStepIndex] ?? null;
  const nextStep =
    activeStepIndex + 1 < navSteps.length ? navSteps[activeStepIndex + 1] : null;

  const closestRouteIndex = useMemo(() => {
    if (!position || navRoute.length === 0) return 0;
    return findClosestRouteIndex(position, navRoute);
  }, [position, navRoute]);

  const passedRoute = useMemo(() => {
    if (navRoute.length === 0) return [] as Position[];
    return navRoute.slice(0, closestRouteIndex + 1);
  }, [navRoute, closestRouteIndex]);

  const remainingRoute = useMemo(() => {
    if (navRoute.length === 0) return [] as Position[];
    return navRoute.slice(closestRouteIndex);
  }, [navRoute, closestRouteIndex]);

  const clearNavigation = useCallback(() => {
    setNavRoute([]);
    setNavDistance(0);
    setNavDuration(0);
    setNavSteps([]);
    setDestination(null);
    setIsDrivingMode(false);
    setIsFollowingSavedTrip(false);
    setActiveSavedTrip(null);
    demoDestinationIndexRef.current = null;
  }, []);

  const calculateRouteToDestination = useCallback(
    async (dest: Position) => {
      if (!position) {
        setSaveMessage("Aún no hay ubicación disponible.");
        return;
      }

      try {
        setIsRouting(true);
        setSaveMessage("");
        setIsFollowingSavedTrip(false);
        setActiveSavedTrip(null);

        if (isDemoMode) {
          const currentIndex = demoIndexRef.current;
          const destinationIndex = findNearestDemoIndex(dest);
          const demoDestination = DEMO_ROUTE[destinationIndex];

          demoDestinationIndexRef.current = destinationIndex;
          setDestination(demoDestination);

          const simulatedRoute = buildDemoNavigationRoute(
            currentIndex,
            destinationIndex
          );
          const simulatedDistance = getPathDistance(simulatedRoute);
          const simulatedDurationSeconds = simulatedDistance / (DEMO_SPEED_KMH / 3.6);
          const simulatedSteps = buildRouteSteps(simulatedRoute, DEMO_SPEED_KMH);

          setNavRoute(simulatedRoute);
          setNavDistance(simulatedDistance);
          setNavDuration(simulatedDurationSeconds);
          setNavSteps(simulatedSteps);
          setIsDrivingMode(true);
          setSaveMessage("Ruta demo calculada correctamente.");
          return;
        }

        setDestination(dest);
        lastRouteTimeRef.current = Date.now();

        const result = await getRoute(position, dest);

        setNavRoute(result.coordinates);
        setNavDistance(result.distanceMeters);
        setNavDuration(result.durationSeconds);
        setNavSteps(result.steps);
        setIsDrivingMode(true);
        setSaveMessage("Ruta calculada correctamente.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error calculando ruta.";
        setSaveMessage(message);
      } finally {
        setIsRouting(false);
      }
    },
    [position, isDemoMode, setSaveMessage]
  )

  const startFixedNavigation = useCallback(async () => {
    if (!position) {
      setSaveMessage("Aún no hay ubicación disponible.");
      return;
    }

    if (isDemoMode) {
      const fixedDemoDestinationIndex = DEMO_ROUTE.length - 1;
      const fixedDemoDestination = DEMO_ROUTE[fixedDemoDestinationIndex];
      await calculateRouteToDestination(fixedDemoDestination);
      return;
    }

    const fixedDestination: Position = [9.9355, -84.0796];
    await calculateRouteToDestination(fixedDestination);
  }, [position, isDemoMode, calculateRouteToDestination, setSaveMessage]);

  const setDemoIndex = useCallback((index: number) => {
    demoIndexRef.current = index;
  }, []);

  useEffect(() => {
    if (!isDemoMode) return;
    if (demoDestinationIndexRef.current === null) return;

    const currentIndex = demoIndexRef.current;
    const destinationIndex = demoDestinationIndexRef.current;

    const simulatedRoute = buildDemoNavigationRoute(currentIndex, destinationIndex);
    const simulatedDistance = getPathDistance(simulatedRoute);
    const simulatedDurationSeconds = simulatedDistance / (DEMO_SPEED_KMH / 3.6);
    const simulatedSteps = buildRouteSteps(simulatedRoute, DEMO_SPEED_KMH);

    setNavRoute(simulatedRoute);
    setNavDistance(simulatedDistance);
    setNavDuration(simulatedDurationSeconds);
    setNavSteps(simulatedSteps);

    if (currentIndex === destinationIndex) {
      setSaveMessage("Destino demo alcanzado.");
    }
  }, [position, isDemoMode, setSaveMessage]);

  useEffect(() => {
    if (!position || !destination || isDemoMode || isFollowingSavedTrip) return;

    const now = Date.now();
    if (now - lastRouteTimeRef.current < 5000) return;

    lastRouteTimeRef.current = now;

    const reroute = async () => {
      try {
        setIsRouting(true);
        const result = await getRoute(position, destination);
        setNavRoute(result.coordinates);
        setNavDistance(result.distanceMeters);
        setNavDuration(result.durationSeconds);
        setNavSteps(result.steps);
      } catch {
        // silencioso
      } finally {
        setIsRouting(false);
      }
    };

    void reroute();
  }, [position, destination, isDemoMode, isFollowingSavedTrip]);

  useEffect(() => {
    const followTripId = searchParams.get("followTripId");

    if (!followTripId || followedTripIdRef.current === followTripId) {
      return;
    }

    const loadTripToFollow = async () => {
      try {
        setIsRouting(true);
        setSaveMessage("");
        setSearchError("");

        const user = await getCurrentUser();
        const trip = user
          ? await getTripByIdFromCloud(followTripId)
          : getTripById(followTripId);

        if (!trip || trip.points.length < 2) {
          setSaveMessage("No se pudo cargar la ruta guardada.");
          return;
        }

        followedTripIdRef.current = followTripId;
        setActiveSavedTrip(trip);
        setSearchQuery(trip.title);
        setSearchResults([]);
        setIsSearchOpen(false);
        setDestination(trip.points[trip.points.length - 1]);
        setNavRoute(trip.points);
        setNavDistance(getPathDistance(trip.points));
        setNavDuration(
          getPathDistance(trip.points) /
            (Math.max(trip.avgSpeedKmh, 5) / 3.6)
        );
        setNavSteps(buildRouteSteps(trip.points, trip.avgSpeedKmh || 30, true));
        setIsFollowingSavedTrip(true);
        setIsDrivingMode(true);
        setSaveMessage(`Siguiendo ruta guardada: ${trip.title}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo cargar la ruta guardada.";
        setSaveMessage(message);
      } finally {
        setIsRouting(false);
      }
    };

    void loadTripToFollow();
  }, [
    searchParams,
    setSearchError,
    setSearchQuery,
    setSearchResults,
    setIsSearchOpen,
    setSaveMessage,
  ]);

  return {
    navRoute,
    navDistance,
    navDuration,
    navSteps,
    isRouting,
    destination,
    isDrivingMode,
    isFollowingSavedTrip,
    activeSavedTrip,
    currentStep,
    nextStep,
    passedRoute,
    remainingRoute,
    calculateRouteToDestination,
    startFixedNavigation,
    clearNavigation,
    setDemoIndex,
    clearSavedTripState: () => {
      setIsFollowingSavedTrip(false);
      setActiveSavedTrip(null);
    },
    resetNavigationForModeChange: () => {
      clearNavigation();
      setSearchResults([]);
      setSearchError("");
      setIsSearchOpen(false);
    },
  };
}

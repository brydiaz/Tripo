"use client";

import { useCallback, useEffect, useState } from "react";
import { getDistance } from "@/lib/map-utils";
import { Position } from "@/types/trip";

export function useTripRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [route, setRoute] = useState<Position[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!isRecording || !startTime) return;

    const intervalId = window.setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecording, startTime]);

  const resetRecordingStats = useCallback(() => {
    setRoute([]);
    setDistance(0);
    setElapsedTime(0);
    setSpeed(0);
    setStartTime(null);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback((position: Position | null) => {
    setRoute(position ? [position] : []);
    setDistance(0);
    setElapsedTime(0);
    setSpeed(0);
    setStartTime(Date.now());
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const pushPosition = useCallback(
    (newPos: Position) => {
      if (!isRecording) return;

      setRoute((prev) => {
        const lastPoint = prev[prev.length - 1];

        if (
          lastPoint &&
          lastPoint[0] === newPos[0] &&
          lastPoint[1] === newPos[1]
        ) {
          return prev;
        }

        if (lastPoint) {
          const d = getDistance(lastPoint, newPos);

          if (d > 1) {
            setDistance((prevDistance) => {
              const updatedDistance = prevDistance + d;

              if (startTime) {
                const totalTimeSec = (Date.now() - startTime) / 1000;
                if (totalTimeSec > 0) {
                  setSpeed(updatedDistance / totalTimeSec);
                }
              }

              return updatedDistance;
            });
          }
        }

        return [...prev, newPos];
      });
    },
    [isRecording, startTime]
  );

  return {
    isRecording,
    route,
    startTime,
    elapsedTime,
    distance,
    speed,
    setRoute,
    startRecording,
    stopRecording,
    pushPosition,
    resetRecordingStats,
  };
}

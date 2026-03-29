export type Position = [number, number];

export type SavedTrip = {
  id: string;
  title: string;
  createdAt: string;
  durationMs: number;
  distanceMeters: number;
  avgSpeedKmh: number;
  points: Position[];
};
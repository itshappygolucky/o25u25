/** Single GPS point on the run path */
export interface PathPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/** Heart rate sample with timestamp */
export interface HeartRateSample {
  timestamp: number;
  bpm: number;
}

/** Saved run (persisted in SQLite) */
export interface Run {
  id: number;
  startTime: number;
  endTime: number;
  distanceKm: number;
  durationSeconds: number;
  paceMinPerKm: number;
  avgHeartRate: number | null;
  path: PathPoint[];
  heartRateSamples: HeartRateSample[];
}

/** Run without id (for saving); path and heartRateSamples stored as JSON in DB */
export interface RunInsert {
  startTime: number;
  endTime: number;
  distanceKm: number;
  durationSeconds: number;
  paceMinPerKm: number;
  avgHeartRate: number | null;
  path: PathPoint[];
  heartRateSamples: HeartRateSample[];
}

/** Live run state during recording */
export interface LiveRunState {
  startTime: number;
  path: PathPoint[];
  heartRateSamples: HeartRateSample[];
  currentBpm: number | null;
}

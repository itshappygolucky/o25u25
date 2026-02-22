import type { PathPoint, HeartRateSample } from "./types";

const R_KM = 6371;

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R_KM * c;
}

/** Total distance in km along the path (sum of segment distances). */
export function pathDistanceKm(path: PathPoint[]): number {
  if (path.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < path.length; i++) {
    d += haversineKm(path[i - 1], path[i]);
  }
  return d;
}

/** Cumulative distance in km at each path point (index 0 = 0, index i = distance up to point i). */
export function pathCumulativeKm(path: PathPoint[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    out.push(out[i - 1] + haversineKm(path[i - 1], path[i]));
  }
  return out;
}

export interface KmSplit {
  km: number;
  paceMinPerKm: number;
}

export interface SplitWithHr extends KmSplit {
  avgHeartRate: number | null;
}

function timeAtKm(path: PathPoint[], cum: number[], targetKm: number): number {
  if (targetKm <= 0) return path[0]!.timestamp;
  for (let i = 1; i < path.length; i++) {
    if (cum[i]! >= targetKm) {
      const p0 = path[i - 1]!;
      const p1 = path[i]!;
      const d0 = cum[i - 1]!;
      const d1 = cum[i]!;
      const frac = (targetKm - d0) / (d1 - d0);
      return p0.timestamp + frac * (p1.timestamp - p0.timestamp);
    }
  }
  return path[path.length - 1]!.timestamp;
}

/** Timestamp at a given km distance (for per-km HR). */
export function getTimeAtKm(path: PathPoint[], km: number): number {
  if (path.length < 2) return path[0]?.timestamp ?? 0;
  const cum = pathCumulativeKm(path);
  return timeAtKm(path, cum, km);
}

/** Splits with average heart rate per km (samples within that km's time range). */
export function getSplitsWithHeartRate(
  path: PathPoint[],
  heartRateSamples: HeartRateSample[]
): SplitWithHr[] {
  const splits = getSplitsFromPath(path);
  if (splits.length === 0 || heartRateSamples.length === 0) {
    return splits.map((s) => ({ ...s, avgHeartRate: null }));
  }
  const cum = pathCumulativeKm(path);
  return splits.map((split) => {
    const tStart = timeAtKm(path, cum, split.km - 1);
    const tEnd = timeAtKm(path, cum, split.km);
    const inRange = heartRateSamples.filter(
      (s) => s.timestamp >= tStart && s.timestamp <= tEnd
    );
    if (inRange.length === 0) {
      return { ...split, avgHeartRate: null };
    }
    const sum = inRange.reduce((a, s) => a + s.bpm, 0);
    return { ...split, avgHeartRate: sum / inRange.length };
  });
}

/** Per-km split paces from path (interpolates time at each km boundary). */
export function getSplitsFromPath(path: PathPoint[]): KmSplit[] {
  if (path.length < 2) return [];
  const cum = pathCumulativeKm(path);
  const totalKm = cum[cum.length - 1]!;
  const fullKms = Math.floor(totalKm);
  if (fullKms < 1) return [];
  const splits: KmSplit[] = [];
  let tPrev = timeAtKm(path, cum, 0);
  for (let km = 1; km <= fullKms; km++) {
    const tCur = timeAtKm(path, cum, km);
    const durationMin = (tCur - tPrev) / 60000;
    splits.push({ km, paceMinPerKm: durationMin });
    tPrev = tCur;
  }
  return splits;
}

/** Pace (min/km) for the current incomplete kilometer, or null if not enough distance. */
export function getCurrentSplitPace(path: PathPoint[]): number | null {
  if (path.length < 2) return null;
  const cum = pathCumulativeKm(path);
  const totalKm = cum[cum.length - 1]!;
  if (totalKm < 0.01) return null;
  const kmStart = Math.floor(totalKm);
  const tEnd = path[path.length - 1]!.timestamp;
  let tStart: number;
  if (kmStart < 1) {
    tStart = path[0]!.timestamp;
  } else {
    const targetKm = kmStart;
    tStart = path[0]!.timestamp;
    for (let i = 1; i < path.length; i++) {
      if (cum[i]! >= targetKm) {
        const p0 = path[i - 1]!;
        const p1 = path[i]!;
        const d0 = cum[i - 1]!;
        const d1 = cum[i]!;
        const frac = (targetKm - d0) / (d1 - d0);
        tStart = p0.timestamp + frac * (p1.timestamp - p0.timestamp);
        break;
      }
    }
  }
  const durationMin = (tEnd - tStart) / 60000;
  const segmentKm = totalKm - kmStart;
  if (segmentKm <= 0) return null;
  return durationMin / segmentKm;
}

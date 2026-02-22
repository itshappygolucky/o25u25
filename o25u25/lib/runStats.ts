import type { PathPoint } from './types';

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance in km between two points.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Total distance in km along the path (sum of segment distances).
 */
export function pathDistanceKm(path: PathPoint[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    total += haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
  }
  return total;
}

/**
 * Pace in min/km from duration (seconds) and distance (km).
 * Returns 0 if distance is 0 (avoid div by zero).
 */
export function paceMinPerKm(durationSeconds: number, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return (durationSeconds / 60) / distanceKm;
}

/**
 * Format pace as "M:SS" per km (e.g. "5:30").
 */
export function formatPace(paceMinPerKm: number): string {
  if (paceMinPerKm <= 0 || !Number.isFinite(paceMinPerKm)) return '—';
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds as "M:SS" or "H:MM:SS".
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

import type { Run, RunInsert } from './types';

const STORAGE_KEY = 'o25u25_runs';

function getRunsFromStorage(): Run[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Run[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRunsToStorage(runs: Run[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

/** Persist a run. Returns the inserted run with id. */
export async function saveRun(run: RunInsert): Promise<Run> {
  const runs = getRunsFromStorage();
  const id = runs.length > 0 ? Math.max(...runs.map((r) => r.id)) + 1 : 1;
  const saved: Run = { id, ...run };
  runs.unshift(saved);
  setRunsToStorage(runs);
  return saved;
}

/** List all runs, newest first. */
export async function getRuns(): Promise<Run[]> {
  return getRunsFromStorage();
}

/** Get a single run by id, or null if not found. */
export async function getRunById(id: number): Promise<Run | null> {
  const runs = getRunsFromStorage();
  return runs.find((r) => r.id === id) ?? null;
}

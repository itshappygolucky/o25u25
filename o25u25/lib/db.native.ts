import * as SQLite from 'expo-sqlite';
import type { Run, RunInsert } from './types';

const DB_NAME = 'runs.db';
let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER NOT NULL,
      distanceKm REAL NOT NULL,
      durationSeconds REAL NOT NULL,
      paceMinPerKm REAL NOT NULL,
      avgHeartRate REAL,
      pathJson TEXT NOT NULL,
      heartRateSamplesJson TEXT NOT NULL
    );
  `);
  return db;
}

/** Persist a run. Returns the inserted run with id. */
export async function saveRun(run: RunInsert): Promise<Run> {
  const database = await getDb();
  const pathJson = JSON.stringify(run.path);
  const heartRateSamplesJson = JSON.stringify(run.heartRateSamples);
  const result = await database.runAsync(
    `INSERT INTO runs (startTime, endTime, distanceKm, durationSeconds, paceMinPerKm, avgHeartRate, pathJson, heartRateSamplesJson)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      run.startTime,
      run.endTime,
      run.distanceKm,
      run.durationSeconds,
      run.paceMinPerKm,
      run.avgHeartRate ?? null,
      pathJson,
      heartRateSamplesJson,
    ]
  );
  const id = result.lastInsertRowId;
  if (id === undefined) throw new Error('Insert failed');
  return {
    id: Number(id),
    ...run,
  };
}

/** List all runs, newest first. */
export async function getRuns(): Promise<Run[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    startTime: number;
    endTime: number;
    distanceKm: number;
    durationSeconds: number;
    paceMinPerKm: number;
    avgHeartRate: number | null;
    pathJson: string;
    heartRateSamplesJson: string;
  }>('SELECT * FROM runs ORDER BY startTime DESC');
  return rows.map(rowToRun);
}

/** Get a single run by id, or null if not found. */
export async function getRunById(id: number): Promise<Run | null> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    startTime: number;
    endTime: number;
    distanceKm: number;
    durationSeconds: number;
    paceMinPerKm: number;
    avgHeartRate: number | null;
    pathJson: string;
    heartRateSamplesJson: string;
  }>('SELECT * FROM runs WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return rowToRun(rows[0]);
}

function rowToRun(row: {
  id: number;
  startTime: number;
  endTime: number;
  distanceKm: number;
  durationSeconds: number;
  paceMinPerKm: number;
  avgHeartRate: number | null;
  pathJson: string;
  heartRateSamplesJson: string;
}): Run {
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    distanceKm: row.distanceKm,
    durationSeconds: row.durationSeconds,
    paceMinPerKm: row.paceMinPerKm,
    avgHeartRate: row.avgHeartRate,
    path: JSON.parse(row.pathJson) as Run['path'],
    heartRateSamples: JSON.parse(row.heartRateSamplesJson) as Run['heartRateSamples'],
  };
}

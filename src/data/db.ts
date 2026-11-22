import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_day INTEGER NOT NULL,
  session_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (routine_day, session_date)
);

CREATE TABLE IF NOT EXISTS set_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  workout_id INTEGER NOT NULL,
  person TEXT NOT NULL CHECK (person IN ('thejus', 'lekshmi')),
  set_number INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  rir INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (session_id, workout_id, person, set_number),
  FOREIGN KEY (session_id) REFERENCES sessions (id),
  FOREIGN KEY (workout_id) REFERENCES workouts (id)
);
`;

export async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('repnote.db');
  await db.execAsync(SCHEMA);
  return db;
}

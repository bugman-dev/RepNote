import type { SQLiteDatabase } from 'expo-sqlite';
import { normalizeWorkoutName } from '../domain/validation';
import type { Person, Session, SetEntry, SetValues, Workout } from '../domain/types';

type WorkoutRow = {
  id: number;
  name: string;
  normalized_name: string;
  created_at: string;
};

type SessionRow = {
  id: number;
  routine_day: number;
  session_date: string;
  created_at: string;
};

type SetRow = {
  id: number;
  session_id: number;
  workout_id: number;
  workout_name: string;
  person: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number;
  created_at: string;
};

function mapWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
  };
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    routineDay: row.routine_day,
    sessionDate: row.session_date,
    createdAt: row.created_at,
  };
}

function asPerson(value: string): Person {
  if (value === 'thejus' || value === 'lekshmi') {
    return value;
  }
  throw new Error(`Unknown person "${value}"`);
}

function mapSet(row: SetRow): SetEntry {
  return {
    id: row.id,
    sessionId: row.session_id,
    workoutId: row.workout_id,
    workoutName: row.workout_name,
    person: asPerson(row.person),
    setNumber: row.set_number,
    weightKg: row.weight_kg,
    reps: row.reps,
    rir: row.rir,
    createdAt: row.created_at,
  };
}

export async function listWorkouts(db: SQLiteDatabase): Promise<Workout[]> {
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT id, name, normalized_name, created_at
     FROM workouts
     ORDER BY id ASC`,
  );
  return rows.map(mapWorkout);
}

export async function insertWorkout(db: SQLiteDatabase, name: string): Promise<Workout> {
  const trimmed = name.trim();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO workouts (name, normalized_name, created_at) VALUES (?, ?, ?)`,
    trimmed,
    normalizeWorkoutName(trimmed),
    createdAt,
  );
  return {
    id: result.lastInsertRowId,
    name: trimmed,
    normalizedName: normalizeWorkoutName(trimmed),
    createdAt,
  };
}

export async function findSession(
  db: SQLiteDatabase,
  routineDay: number,
  sessionDate: string,
): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT id, routine_day, session_date, created_at
     FROM sessions
     WHERE routine_day = ? AND session_date = ?`,
    routineDay,
    sessionDate,
  );
  return row ? mapSession(row) : null;
}

export async function listSets(db: SQLiteDatabase, sessionId: number): Promise<SetEntry[]> {
  const rows = await db.getAllAsync<SetRow>(
    `SELECT
       set_entries.id AS id,
       set_entries.session_id AS session_id,
       set_entries.workout_id AS workout_id,
       workouts.name AS workout_name,
       set_entries.person AS person,
       set_entries.set_number AS set_number,
       set_entries.weight_kg AS weight_kg,
       set_entries.reps AS reps,
       set_entries.rir AS rir,
       set_entries.created_at AS created_at
     FROM set_entries
     JOIN workouts ON workouts.id = set_entries.workout_id
     WHERE set_entries.session_id = ?
     ORDER BY set_entries.id ASC`,
    sessionId,
  );
  return rows.map(mapSet);
}

export async function addSet(
  db: SQLiteDatabase,
  input: {
    routineDay: number;
    sessionDate: string;
    workoutId: number;
    person: Person;
  } & SetValues,
): Promise<void> {
  const createdAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO sessions (routine_day, session_date, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT (routine_day, session_date) DO NOTHING`,
      input.routineDay,
      input.sessionDate,
      createdAt,
    );
    const session = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM sessions WHERE routine_day = ? AND session_date = ?`,
      input.routineDay,
      input.sessionDate,
    );
    if (!session) {
      throw new Error('Could not save the session');
    }
    const next = await db.getFirstAsync<{ next_number: number }>(
      `SELECT COALESCE(MAX(set_number), 0) + 1 AS next_number
       FROM set_entries
       WHERE session_id = ? AND workout_id = ? AND person = ?`,
      session.id,
      input.workoutId,
      input.person,
    );
    await db.runAsync(
      `INSERT INTO set_entries (
         session_id, workout_id, person, set_number, weight_kg, reps, rir, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      input.workoutId,
      input.person,
      next?.next_number ?? 1,
      input.weightKg,
      input.reps,
      input.rir,
      createdAt,
    );
  });
}

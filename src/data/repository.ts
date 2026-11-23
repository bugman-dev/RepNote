import type { SQLiteDatabase } from 'expo-sqlite';
import { normalizeName, normalizeWorkoutName } from '../domain/validation';
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

type PersonRow = {
  id: number;
  name: string;
  normalized_name: string;
  created_at: string;
};

type SetRow = {
  id: number;
  session_id: number;
  workout_id: number;
  workout_name: string;
  person_id: number;
  person_name: string;
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

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
  };
}

function mapSet(row: SetRow): SetEntry {
  return {
    id: row.id,
    sessionId: row.session_id,
    workoutId: row.workout_id,
    workoutName: row.workout_name,
    personId: row.person_id,
    personName: row.person_name,
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

export async function listPeople(db: SQLiteDatabase): Promise<Person[]> {
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT id, name, normalized_name, created_at
     FROM people
     ORDER BY id ASC`,
  );
  return rows.map(mapPerson);
}

export async function insertPerson(db: SQLiteDatabase, name: string): Promise<Person> {
  const trimmed = name.trim();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO people (name, normalized_name, created_at) VALUES (?, ?, ?)`,
    trimmed,
    normalizeName(trimmed),
    createdAt,
  );
  return {
    id: result.lastInsertRowId,
    name: trimmed,
    normalizedName: normalizeName(trimmed),
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
       set_entries.person_id AS person_id,
       people.name AS person_name,
       set_entries.set_number AS set_number,
       set_entries.weight_kg AS weight_kg,
       set_entries.reps AS reps,
       set_entries.rir AS rir,
       set_entries.created_at AS created_at
     FROM set_entries
     JOIN workouts ON workouts.id = set_entries.workout_id
     JOIN people ON people.id = set_entries.person_id
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
    personId: number;
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
       WHERE session_id = ? AND workout_id = ? AND person_id = ?`,
      session.id,
      input.workoutId,
      input.personId,
    );
    await db.runAsync(
      `INSERT INTO set_entries (
         session_id, workout_id, person_id, set_number, weight_kg, reps, rir, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      input.workoutId,
      input.personId,
      next?.next_number ?? 1,
      input.weightKg,
      input.reps,
      input.rir,
      createdAt,
    );
  });
}

export async function deleteSet(db: SQLiteDatabase, setId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{
      session_id: number;
      workout_id: number;
      person_id: number;
    }>(
      `SELECT session_id, workout_id, person_id FROM set_entries WHERE id = ?`,
      setId,
    );
    if (!row) {
      throw new Error('That set is no longer on this day');
    }
    await db.runAsync(`DELETE FROM set_entries WHERE id = ?`, setId);
    const remaining = await db.getAllAsync<{ id: number }>(
      `SELECT id
       FROM set_entries
       WHERE session_id = ? AND workout_id = ? AND person_id = ?
       ORDER BY set_number ASC, id ASC`,
      row.session_id,
      row.workout_id,
      row.person_id,
    );
    for (let index = 0; index < remaining.length; index += 1) {
      await db.runAsync(
        `UPDATE set_entries SET set_number = ? WHERE id = ?`,
        -(index + 1),
        remaining[index].id,
      );
    }
    for (let index = 0; index < remaining.length; index += 1) {
      await db.runAsync(
        `UPDATE set_entries SET set_number = ? WHERE id = ?`,
        index + 1,
        remaining[index].id,
      );
    }
  });
}

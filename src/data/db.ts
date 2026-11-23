import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const BASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_day INTEGER NOT NULL,
  session_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (routine_day, session_date)
);
`;

const SET_ENTRIES_SCHEMA = `
CREATE TABLE IF NOT EXISTS set_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  workout_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  rir INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (session_id, workout_id, person_id, set_number),
  FOREIGN KEY (session_id) REFERENCES sessions (id),
  FOREIGN KEY (workout_id) REFERENCES workouts (id),
  FOREIGN KEY (person_id) REFERENCES people (id)
);
`;

const LEGACY_PEOPLE = [
  { key: 'thejus', name: 'Thejus' },
  { key: 'lekshmi', name: 'Lekshmi' },
];

export async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('repnote.db');
  await db.execAsync(BASE_SCHEMA);
  await ensureActiveFlag(db, 'workouts');
  await ensureActiveFlag(db, 'people');
  await migrateSetEntries(db);
  return db;
}

async function ensureActiveFlag(db: SQLiteDatabase, table: 'workouts' | 'people'): Promise<void> {
  const columns = await columnNames(db, table);
  if (!columns.includes('active')) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN active INTEGER NOT NULL DEFAULT 1`);
  }
}

async function columnNames(db: SQLiteDatabase, table: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((row) => row.name);
}

async function migrateSetEntries(db: SQLiteDatabase): Promise<void> {
  const columns = await columnNames(db, 'set_entries');
  if (columns.includes('person_id')) {
    return;
  }
  if (!columns.includes('person')) {
    await db.execAsync(SET_ENTRIES_SCHEMA);
    return;
  }

  const stored = await db.getAllAsync<{ person: string }>(
    `SELECT DISTINCT person FROM set_entries`,
  );
  const keys = stored.map((row) => row.person);
  const ordered = [
    ...LEGACY_PEOPLE.map((person) => person.key),
    ...keys.filter((key) => !LEGACY_PEOPLE.some((person) => person.key === key)),
  ];
  const createdAt = new Date().toISOString();
  for (const key of ordered) {
    const known = LEGACY_PEOPLE.find((person) => person.key === key);
    const name = known?.name ?? key;
    const normalized = name.trim().toLocaleLowerCase();
    await db.runAsync(
      `INSERT INTO people (name, normalized_name, created_at)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM people WHERE normalized_name = ?)`,
      name,
      normalized,
      createdAt,
      normalized,
    );
  }

  await db.execAsync(`
      BEGIN;
      CREATE TABLE set_entries_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        workout_id INTEGER NOT NULL,
        person_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        reps INTEGER NOT NULL,
        rir INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (session_id, workout_id, person_id, set_number),
        FOREIGN KEY (session_id) REFERENCES sessions (id),
        FOREIGN KEY (workout_id) REFERENCES workouts (id),
        FOREIGN KEY (person_id) REFERENCES people (id)
      );

      INSERT INTO set_entries_next (
        id, session_id, workout_id, person_id, set_number, weight_kg, reps, rir, created_at
      )
      SELECT
        set_entries.id,
        set_entries.session_id,
        set_entries.workout_id,
        people.id,
        set_entries.set_number,
        set_entries.weight_kg,
        set_entries.reps,
        set_entries.rir,
        set_entries.created_at
      FROM set_entries
      JOIN people ON people.normalized_name = CASE set_entries.person
        WHEN 'thejus' THEN 'thejus'
        WHEN 'lekshmi' THEN 'lekshmi'
        ELSE lower(trim(set_entries.person))
      END;

      DROP TABLE set_entries;
      ALTER TABLE set_entries_next RENAME TO set_entries;
      COMMIT;
    `);
}

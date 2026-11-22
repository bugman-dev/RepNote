import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { todayIso } from '../domain/dates';
import { exportFileName, formatSessionExport } from '../domain/formatExport';
import type { Person, SetEntry, SetValues, Workout } from '../domain/types';
import { validateWorkoutName } from '../domain/validation';
import { addSet as insertSet, findSession, insertWorkout, listSets, listWorkouts } from '../data/repository';
import { saveTextFile } from '../export/saveTextFile';

type Screen = 'session' | 'workouts';

type SessionContextValue = {
  routineDay: number;
  sessionDate: string;
  workouts: Workout[];
  selectedWorkoutId: number | null;
  person: Person;
  sets: SetEntry[];
  screen: Screen;
  drawerOpen: boolean;
  setRoutineDay: (day: number) => void;
  setSessionDate: (isoDate: string) => void;
  setSelectedWorkoutId: (workoutId: number) => void;
  setPerson: (person: Person) => void;
  addSet: (values: SetValues) => Promise<void>;
  addWorkout: (name: string) => Promise<{ error?: string }>;
  exportSession: () => Promise<{ cancelled: boolean }>;
  openDrawer: () => void;
  closeDrawer: () => void;
  showWorkouts: () => void;
  showSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type Selection = {
  routineDay: number;
  sessionDate: string;
};

export function SessionProvider({
  db,
  children,
}: {
  db: SQLiteDatabase;
  children: ReactNode;
}) {
  const [routineDay, setRoutineDay] = useState(1);
  const [sessionDate, setSessionDate] = useState(todayIso);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [person, setPerson] = useState<Person>('thejus');
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [screen, setScreen] = useState<Screen>('session');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selection = useRef<Selection>({ routineDay: 1, sessionDate: todayIso() });
  const loadId = useRef(0);
  const queue = useRef(Promise.resolve());

  selection.current = { routineDay, sessionDate };

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(task, task);
    queue.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const loadSession = useCallback(
    async (day: number, date: string) => {
      const id = ++loadId.current;
      const session = await findSession(db, day, date);
      const nextSets = session ? await listSets(db, session.id) : [];
      if (loadId.current !== id) {
        return;
      }
      setSets(nextSets);
    },
    [db],
  );

  useEffect(() => {
    let cancelled = false;
    listWorkouts(db)
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setWorkouts(rows);
        setSelectedWorkoutId((current) => {
          if (current != null && rows.some((row) => row.id === current)) {
            return current;
          }
          return rows[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setWorkouts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    void loadSession(routineDay, sessionDate);
  }, [loadSession, routineDay, sessionDate]);

  const addSet = useCallback(
    async (values: SetValues) => {
      if (selectedWorkoutId == null) {
        throw new Error('Choose a workout');
      }
      const day = routineDay;
      const date = sessionDate;
      const workoutId = selectedWorkoutId;
      const selectedPerson = person;
      await enqueue(async () => {
        await insertSet(db, {
          routineDay: day,
          sessionDate: date,
          workoutId,
          person: selectedPerson,
          ...values,
        });
        const current = selection.current;
        if (current.routineDay === day && current.sessionDate === date) {
          await loadSession(day, date);
        }
      });
    },
    [db, enqueue, loadSession, person, routineDay, selectedWorkoutId, sessionDate],
  );

  const addWorkout = useCallback(
    async (name: string) => {
      const check = validateWorkoutName(
        name,
        workouts.map((workout) => workout.normalizedName),
      );
      if (!check.name) {
        return { error: check.error ?? 'Enter a workout name' };
      }
      const savedName = check.name;
      try {
        const workout = await enqueue(() => insertWorkout(db, savedName));
        setWorkouts((current) => [...current, workout]);
        setSelectedWorkoutId((current) => current ?? workout.id);
        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('unique')) {
          return { error: 'That workout name already exists' };
        }
        return { error: 'Could not save that workout name' };
      }
    },
    [db, enqueue, workouts],
  );

  const exportSession = useCallback(async () => {
    const contents = formatSessionExport(routineDay, sessionDate, sets);
    const fileName = exportFileName(routineDay, sessionDate);
    return saveTextFile(fileName, contents);
  }, [routineDay, sessionDate, sets]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const showWorkouts = useCallback(() => {
    setDrawerOpen(false);
    setScreen('workouts');
  }, []);
  const showSession = useCallback(() => setScreen('session'), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      routineDay,
      sessionDate,
      workouts,
      selectedWorkoutId,
      person,
      sets,
      screen,
      drawerOpen,
      setRoutineDay,
      setSessionDate,
      setSelectedWorkoutId,
      setPerson,
      addSet,
      addWorkout,
      exportSession,
      openDrawer,
      closeDrawer,
      showWorkouts,
      showSession,
    }),
    [
      addSet,
      addWorkout,
      closeDrawer,
      drawerOpen,
      exportSession,
      openDrawer,
      person,
      routineDay,
      screen,
      selectedWorkoutId,
      sessionDate,
      sets,
      showSession,
      showWorkouts,
      workouts,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return value;
}

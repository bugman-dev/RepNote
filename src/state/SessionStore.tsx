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
import { validatePersonName, validateWorkoutName } from '../domain/validation';
import {
  addSet as insertSet,
  deleteSet as removeSet,
  findSession,
  insertPerson,
  insertWorkout,
  listPeople,
  listSets,
  listWorkouts,
} from '../data/repository';
import { saveTextFile } from '../export/saveTextFile';

type Screen = 'session' | 'workouts' | 'people';
type SessionStatus = 'loading' | 'ready' | 'error';

const SESSION_LOAD_ERROR = 'Could not load sets for this day.';
const WORKOUT_LOAD_ERROR = 'Could not load workout names.';
const PERSON_LOAD_ERROR = 'Could not load people.';

type SessionView = {
  key: string;
  status: SessionStatus;
  error: string | null;
  sets: SetEntry[];
};

function sessionKey(day: number, date: string): string {
  return `${day}|${date}`;
}

type SessionContextValue = {
  routineDay: number;
  sessionDate: string;
  workouts: Workout[];
  people: Person[];
  selectedWorkoutId: number | null;
  selectedPersonId: number | null;
  sets: SetEntry[];
  sessionStatus: SessionStatus;
  sessionError: string | null;
  workoutError: string | null;
  personError: string | null;
  screen: Screen;
  drawerOpen: boolean;
  setRoutineDay: (day: number) => void;
  setSessionDate: (isoDate: string) => void;
  setSelectedWorkoutId: (workoutId: number) => void;
  setSelectedPersonId: (personId: number) => void;
  addSet: (values: SetValues) => Promise<void>;
  deleteSet: (setId: number) => Promise<void>;
  addWorkout: (name: string) => Promise<{ error?: string }>;
  addPerson: (name: string) => Promise<{ error?: string }>;
  exportSession: () => Promise<{ cancelled: boolean }>;
  reloadSession: () => Promise<void>;
  reloadWorkouts: () => Promise<void>;
  reloadPeople: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  showWorkouts: () => void;
  showPeople: () => void;
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
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [sessionView, setSessionView] = useState<SessionView | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [personError, setPersonError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('session');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const selection = useRef<Selection>({ routineDay: 1, sessionDate: todayIso() });
  const loadId = useRef(0);
  const queue = useRef(Promise.resolve());

  selection.current = { routineDay, sessionDate };
  const selectionKey = sessionKey(routineDay, sessionDate);
  if (sessionView?.key !== selectionKey) {
    setSessionView({
      key: selectionKey,
      status: 'loading',
      error: null,
      sets: [],
    });
  }
  const sets = sessionView?.key === selectionKey ? sessionView.sets : [];
  const sessionStatus: SessionStatus = sessionView?.key === selectionKey ? sessionView.status : 'loading';
  const sessionError = sessionView?.key === selectionKey ? sessionView.error : null;

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(task, task);
    queue.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const applyWorkouts = useCallback((rows: Workout[]) => {
    setWorkouts(rows);
    setSelectedWorkoutId((current) => {
      if (current != null && rows.some((row) => row.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
    setWorkoutError(null);
  }, []);

  const reloadWorkouts = useCallback(async () => {
    try {
      applyWorkouts(await listWorkouts(db));
    } catch {
      setWorkoutError(WORKOUT_LOAD_ERROR);
    }
  }, [applyWorkouts, db]);

  const applyPeople = useCallback((rows: Person[]) => {
    setPeople(rows);
    setSelectedPersonId((current) => {
      if (current != null && rows.some((row) => row.id === current)) {
        return current;
      }
      return rows[0]?.id ?? null;
    });
    setPersonError(null);
  }, []);

  const reloadPeople = useCallback(async () => {
    try {
      applyPeople(await listPeople(db));
    } catch {
      setPersonError(PERSON_LOAD_ERROR);
    }
  }, [applyPeople, db]);

  const loadSession = useCallback(
    async (day: number, date: string) => {
      const id = ++loadId.current;
      const key = sessionKey(day, date);
      setSessionView((current) => ({
        key,
        status: 'loading',
        error: null,
        sets: current?.key === key ? current.sets : [],
      }));
      try {
        const session = await findSession(db, day, date);
        const nextSets = session ? await listSets(db, session.id) : [];
        if (loadId.current !== id) {
          return;
        }
        setSessionView({ key, status: 'ready', error: null, sets: nextSets });
      } catch {
        if (loadId.current !== id) {
          return;
        }
        setSessionView((current) => ({
          key,
          status: 'error',
          error: SESSION_LOAD_ERROR,
          sets: current?.key === key ? current.sets : [],
        }));
      }
    },
    [db],
  );

  const reloadSession = useCallback(
    () => loadSession(routineDay, sessionDate),
    [loadSession, routineDay, sessionDate],
  );

  useEffect(() => {
    let cancelled = false;
    listWorkouts(db)
      .then((rows) => {
        if (!cancelled) {
          applyWorkouts(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkoutError(WORKOUT_LOAD_ERROR);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyWorkouts, db]);

  useEffect(() => {
    let cancelled = false;
    listPeople(db)
      .then((rows) => {
        if (!cancelled) {
          applyPeople(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPersonError(PERSON_LOAD_ERROR);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyPeople, db]);

  useEffect(() => {
    void loadSession(routineDay, sessionDate);
  }, [loadSession, routineDay, sessionDate]);

  const addSet = useCallback(
    async (values: SetValues) => {
      if (selectedWorkoutId == null) {
        throw new Error('Choose a workout');
      }
      if (selectedPersonId == null) {
        throw new Error('Choose a person');
      }
      const day = routineDay;
      const date = sessionDate;
      const workoutId = selectedWorkoutId;
      const personId = selectedPersonId;
      await enqueue(async () => {
        await insertSet(db, {
          routineDay: day,
          sessionDate: date,
          workoutId,
          personId,
          ...values,
        });
        const current = selection.current;
        if (current.routineDay === day && current.sessionDate === date) {
          await loadSession(day, date);
        }
      });
    },
    [db, enqueue, loadSession, routineDay, selectedPersonId, selectedWorkoutId, sessionDate],
  );

  const deleteSet = useCallback(
    async (setId: number) => {
      const day = routineDay;
      const date = sessionDate;
      await enqueue(async () => {
        await removeSet(db, setId);
        const current = selection.current;
        if (current.routineDay === day && current.sessionDate === date) {
          await loadSession(day, date);
        }
      });
    },
    [db, enqueue, loadSession, routineDay, sessionDate],
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

  const addPerson = useCallback(
    async (name: string) => {
      const check = validatePersonName(
        name,
        people.map((person) => person.normalizedName),
      );
      if (!check.name) {
        return { error: check.error ?? 'Enter a person name' };
      }
      const savedName = check.name;
      try {
        const person = await enqueue(() => insertPerson(db, savedName));
        setPeople((current) => [...current, person]);
        setSelectedPersonId((current) => current ?? person.id);
        return {};
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('unique')) {
          return { error: 'That person name already exists' };
        }
        return { error: 'Could not save that person name' };
      }
    },
    [db, enqueue, people],
  );

  const exportSession = useCallback(async () => {
    if (sessionStatus !== 'ready') {
      throw new Error(sessionError ?? 'This day is still loading.');
    }
    const contents = formatSessionExport(routineDay, sessionDate, sets);
    const fileName = exportFileName(routineDay, sessionDate);
    return saveTextFile(fileName, contents);
  }, [routineDay, sessionDate, sessionError, sessionStatus, sets]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const showWorkouts = useCallback(() => {
    setDrawerOpen(false);
    setScreen('workouts');
  }, []);
  const showPeople = useCallback(() => {
    setDrawerOpen(false);
    setScreen('people');
  }, []);
  const showSession = useCallback(() => setScreen('session'), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      routineDay,
      sessionDate,
      workouts,
      people,
      selectedWorkoutId,
      selectedPersonId,
      sets,
      sessionStatus,
      sessionError,
      workoutError,
      personError,
      screen,
      drawerOpen,
      setRoutineDay,
      setSessionDate,
      setSelectedWorkoutId,
      setSelectedPersonId,
      addSet,
      deleteSet,
      addWorkout,
      addPerson,
      exportSession,
      reloadSession,
      reloadWorkouts,
      reloadPeople,
      openDrawer,
      closeDrawer,
      showWorkouts,
      showPeople,
      showSession,
    }),
    [
      addPerson,
      addSet,
      addWorkout,
      closeDrawer,
      deleteSet,
      drawerOpen,
      exportSession,
      openDrawer,
      people,
      personError,
      reloadPeople,
      reloadSession,
      reloadWorkouts,
      routineDay,
      screen,
      selectedPersonId,
      selectedWorkoutId,
      sessionDate,
      sessionError,
      sessionStatus,
      sets,
      showPeople,
      showSession,
      showWorkouts,
      workoutError,
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

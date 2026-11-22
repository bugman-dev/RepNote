export type Person = 'thejus' | 'lekshmi';

export const PEOPLE: { id: Person; label: string }[] = [
  { id: 'thejus', label: 'Thejus' },
  { id: 'lekshmi', label: 'Lekshmi' },
];

export const ROUTINE_DAYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type RoutineDay = (typeof ROUTINE_DAYS)[number];

export function formatDayLabel(day: number): string {
  return `Day ${String(day).padStart(2, '0')}`;
}

export function personLabel(person: Person): string {
  return person === 'thejus' ? 'Thejus' : 'Lekshmi';
}

export type Workout = {
  id: number;
  name: string;
  normalizedName: string;
  createdAt: string;
};

export type Session = {
  id: number;
  routineDay: number;
  sessionDate: string;
  createdAt: string;
};

export type SetEntry = {
  id: number;
  sessionId: number;
  workoutId: number;
  workoutName: string;
  person: Person;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number;
  createdAt: string;
};

export type SetValues = {
  weightKg: number;
  reps: number;
  rir: number;
};

export const ROUTINE_DAYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type RoutineDay = (typeof ROUTINE_DAYS)[number];

export function formatDayLabel(day: number): string {
  return `Day ${String(day).padStart(2, '0')}`;
}

export type Workout = {
  id: number;
  name: string;
  normalizedName: string;
  createdAt: string;
};

export type Person = {
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
  personId: number;
  personName: string;
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

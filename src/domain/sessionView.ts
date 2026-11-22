import type { Person, SetEntry } from './types';

export type WorkoutGroup = {
  workoutId: number;
  name: string;
  sets: SetEntry[];
};

export function nextSetNumber(
  sets: SetEntry[],
  workoutId: number | null,
  person: Person,
): number {
  if (workoutId == null) {
    return 1;
  }
  const numbers = sets
    .filter((set) => set.workoutId === workoutId && set.person === person)
    .map((set) => set.setNumber);
  if (numbers.length === 0) {
    return 1;
  }
  return Math.max(...numbers) + 1;
}

export function groupSets(sets: SetEntry[]): WorkoutGroup[] {
  const groups: WorkoutGroup[] = [];
  const byWorkout = new Map<number, WorkoutGroup>();
  const ordered = [...sets].sort((a, b) => a.id - b.id);

  for (const set of ordered) {
    let group = byWorkout.get(set.workoutId);
    if (!group) {
      group = { workoutId: set.workoutId, name: set.workoutName, sets: [] };
      byWorkout.set(set.workoutId, group);
      groups.push(group);
    }
    group.sets.push(set);
  }

  return groups;
}

export function setsForPerson(sets: SetEntry[], person: Person): SetEntry[] {
  return sets
    .filter((set) => set.person === person)
    .sort((a, b) => a.setNumber - b.setNumber);
}

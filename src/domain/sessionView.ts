import type { SetEntry } from './types';

export type WorkoutGroup = {
  workoutId: number;
  name: string;
  sets: SetEntry[];
};

export type ListedPerson = {
  id: number;
  name: string;
};

export function nextSetNumber(
  sets: SetEntry[],
  workoutId: number | null,
  personId: number | null,
): number {
  if (workoutId == null || personId == null) {
    return 1;
  }
  const numbers = sets
    .filter((set) => set.workoutId === workoutId && set.personId === personId)
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

export function listedPeople(sets: SetEntry[]): ListedPerson[] {
  const people = new Map<number, string>();
  for (const set of sets) {
    if (!people.has(set.personId)) {
      people.set(set.personId, set.personName);
    }
  }
  return [...people.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, name]) => ({ id, name }));
}

export function setsForPerson(sets: SetEntry[], personId: number): SetEntry[] {
  return sets
    .filter((set) => set.personId === personId)
    .sort((a, b) => a.setNumber - b.setNumber);
}

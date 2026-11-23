import { formatLongDate } from './dates';
import { listedPeople } from './sessionView';
import { formatDayLabel, type SetEntry } from './types';

export function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function formatWeight(kg: number): string {
  if (Number.isInteger(kg)) {
    return String(kg);
  }
  return String(Number(kg.toFixed(3)));
}

export function formatSetLine(set: Pick<SetEntry, 'setNumber' | 'weightKg' | 'reps' | 'rir'>): string {
  return `${ordinal(set.setNumber)} set - ${formatWeight(set.weightKg)} kg - ${set.reps} reps - ${set.rir} rir`;
}

export function exportFileName(routineDay: number, sessionDate: string): string {
  return `${formatDayLabel(routineDay)} (${formatLongDate(sessionDate)}).txt`;
}

type WorkoutBlock = {
  name: string;
  firstId: number;
  sets: SetEntry[];
};

export function formatSessionExport(
  routineDay: number,
  sessionDate: string,
  sets: SetEntry[],
): string {
  const header = `======= ${formatDayLabel(routineDay)} (${formatLongDate(sessionDate)}) =======`;
  if (sets.length === 0) {
    return `${header}\n`;
  }

  const blocks = new Map<number, WorkoutBlock>();
  for (const set of sets) {
    const existing = blocks.get(set.workoutId);
    if (existing) {
      existing.sets.push(set);
      existing.firstId = Math.min(existing.firstId, set.id);
    } else {
      blocks.set(set.workoutId, {
        name: set.workoutName,
        firstId: set.id,
        sets: [set],
      });
    }
  }

  const ordered = [...blocks.values()].sort((a, b) => a.firstId - b.firstId);
  const body = ordered.map(formatWorkoutBlock).join('\n\n');
  return `${header}\n\n${body}\n`;
}

function formatWorkoutBlock(block: WorkoutBlock): string {
  const lines: string[] = [block.name, ''];
  const present = listedPeople(block.sets);

  present.forEach((person, index) => {
    lines.push(person.name);
    const personSets = block.sets
      .filter((set) => set.personId === person.id)
      .sort((a, b) => a.setNumber - b.setNumber);
    for (const set of personSets) {
      lines.push(formatSetLine(set));
    }
    if (index < present.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
}

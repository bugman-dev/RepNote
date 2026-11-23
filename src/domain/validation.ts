import type { SetValues } from './types';

export type SetField = 'weight' | 'reps' | 'rir';

export type SetFieldErrors = Partial<Record<SetField, string>>;

export type SetInput = Record<SetField, string>;

const WEIGHT_PATTERN = /^\d+(\.\d+)?$/;
const WHOLE_PATTERN = /^\d+$/;

export function validateSetInput(input: SetInput): {
  values?: SetValues;
  errors: SetFieldErrors;
} {
  const errors: SetFieldErrors = {};

  const weightText = input.weight.trim();
  const repsText = input.reps.trim();
  const rirText = input.rir.trim();

  let weightKg: number | null = null;
  let reps: number | null = null;
  let rir: number | null = null;

  if (weightText === '') {
    errors.weight = 'Enter a weight';
  } else if (!WEIGHT_PATTERN.test(weightText)) {
    errors.weight = 'Weight must be a number';
  } else {
    weightKg = Number(weightText);
  }

  if (repsText === '') {
    errors.reps = 'Enter reps';
  } else if (!WHOLE_PATTERN.test(repsText)) {
    errors.reps = 'Reps must be a whole number';
  } else {
    reps = Number(repsText);
  }

  if (rirText === '') {
    errors.rir = 'Enter RIR';
  } else if (!WHOLE_PATTERN.test(rirText)) {
    errors.rir = 'RIR must be a whole number';
  } else {
    rir = Number(rirText);
  }

  if (weightKg === null || reps === null || rir === null) {
    return { errors };
  }

  return { errors, values: { weightKg, reps, rir } };
}

export function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function normalizeWorkoutName(name: string): string {
  return normalizeName(name);
}

function validateNamedEntry(
  name: string,
  existingNormalized: string[],
  noun: string,
): { name?: string; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: `Enter a ${noun}` };
  }
  if (existingNormalized.includes(normalizeName(trimmed))) {
    return { error: `That ${noun} already exists` };
  }
  return { name: trimmed };
}

export function validateWorkoutName(
  name: string,
  existingNormalized: string[],
): { name?: string; error?: string } {
  return validateNamedEntry(name, existingNormalized, 'workout name');
}

export function validatePersonName(
  name: string,
  existingNormalized: string[],
): { name?: string; error?: string } {
  return validateNamedEntry(name, existingNormalized, 'person name');
}

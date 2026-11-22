import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { exportFileName, formatSessionExport, formatSetLine, ordinal } from './formatExport';
import type { Person, SetEntry } from './types';

const sessionDate = '2026-11-18';

function entry(values: {
  id: number;
  workoutId: number;
  workoutName: string;
  person: Person;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  rir?: number;
}): SetEntry {
  return {
    id: values.id,
    sessionId: 1,
    workoutId: values.workoutId,
    workoutName: values.workoutName,
    person: values.person,
    setNumber: values.setNumber,
    weightKg: values.weightKg ?? 25,
    reps: values.reps ?? 10,
    rir: values.rir ?? 2,
    createdAt: '2026-11-18T00:00:00.000Z',
  };
}

describe('ordinal', () => {
  it('uses teen exceptions and the usual suffixes', () => {
    assert.equal(ordinal(1), '1st');
    assert.equal(ordinal(2), '2nd');
    assert.equal(ordinal(3), '3rd');
    assert.equal(ordinal(4), '4th');
    assert.equal(ordinal(11), '11th');
    assert.equal(ordinal(12), '12th');
    assert.equal(ordinal(13), '13th');
    assert.equal(ordinal(21), '21st');
    assert.equal(ordinal(22), '22nd');
    assert.equal(ordinal(23), '23rd');
    assert.equal(ordinal(111), '111th');
  });
});

describe('formatSetLine', () => {
  it('keeps whole kilograms whole and keeps RIR 0', () => {
    assert.equal(
      formatSetLine({ setNumber: 1, weightKg: 25, reps: 20, rir: 0 }),
      '1st set - 25 kg - 20 reps - 0 rir',
    );
    assert.equal(
      formatSetLine({ setNumber: 11, weightKg: 10.5, reps: 8, rir: 1 }),
      '11th set - 10.5 kg - 8 reps - 1 rir',
    );
  });
});

describe('formatSessionExport', () => {
  it('writes the header only when the day has no sets', () => {
    assert.equal(
      formatSessionExport(2, sessionDate, []),
      '======= Day 02 (18 November 2026) =======\n',
    );
  });

  it('orders workouts by the first logged set, Thejus before Lekshmi, and skips an absent person', () => {
    const text = formatSessionExport(1, sessionDate, [
      entry({
        id: 10,
        workoutId: 2,
        workoutName: 'Press',
        person: 'lekshmi',
        setNumber: 1,
        weightKg: 15,
        reps: 12,
        rir: 0,
      }),
      entry({
        id: 4,
        workoutId: 1,
        workoutName: 'Fly',
        person: 'thejus',
        setNumber: 2,
        reps: 18,
        rir: 1,
      }),
      entry({
        id: 3,
        workoutId: 1,
        workoutName: 'Fly',
        person: 'lekshmi',
        setNumber: 1,
        weightKg: 10.5,
        reps: 12,
        rir: 0,
      }),
      entry({
        id: 2,
        workoutId: 1,
        workoutName: 'Fly',
        person: 'thejus',
        setNumber: 1,
        reps: 20,
        rir: 2,
      }),
    ]);

    assert.equal(
      text,
      [
        '======= Day 01 (18 November 2026) =======',
        '',
        'Fly',
        '',
        'Thejus',
        '1st set - 25 kg - 20 reps - 2 rir',
        '2nd set - 25 kg - 18 reps - 1 rir',
        '',
        'Lekshmi',
        '1st set - 10.5 kg - 12 reps - 0 rir',
        '',
        'Press',
        '',
        'Lekshmi',
        '1st set - 15 kg - 12 reps - 0 rir',
        '',
      ].join('\n'),
    );
  });
});

describe('exportFileName', () => {
  it('matches the day header without the rule lines', () => {
    assert.equal(exportFileName(1, sessionDate), 'Day 01 (18 November 2026).txt');
  });
});

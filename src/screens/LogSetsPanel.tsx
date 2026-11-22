import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DropdownField } from '../components/DropdownField';
import { nextSetNumber } from '../domain/sessionView';
import { PEOPLE, personLabel } from '../domain/types';
import { validateSetInput, type SetFieldErrors } from '../domain/validation';
import { useSession } from '../state/SessionStore';
import { colors, radius } from '../theme';

export function LogSetsPanel() {
  const {
    workouts,
    selectedWorkoutId,
    setSelectedWorkoutId,
    person,
    setPerson,
    sets,
    addSet,
  } = useSession();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [errors, setErrors] = useState<SetFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const upcoming = nextSetNumber(sets, selectedWorkoutId, person);
  const loggedLabel =
    sets.length === 0
      ? 'No sets logged · tap to add the next set'
      : `${sets.length} ${sets.length === 1 ? 'set' : 'sets'} logged · tap to add the next set`;

  const onAdd = async () => {
    if (saving) {
      return;
    }
    if (selectedWorkoutId == null) {
      setFormError('Choose a workout');
      return;
    }
    const result = validateSetInput({ weight, reps, rir });
    setErrors(result.errors);
    if (!result.values) {
      setFormError(null);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await addSet(result.values);
      setWeight('');
      setReps('');
      setRir('');
      setErrors({});
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save that set');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text style={styles.heading}>Add a set</Text>
      <Text style={styles.subhead}>Choose the exercise and person. Set number fills itself in.</Text>

      <DropdownField
        label="WORKOUT"
        value={selectedWorkoutId == null ? null : String(selectedWorkoutId)}
        placeholder="Add a workout name"
        emptyText="No workout names yet. Add one from the menu."
        options={workouts.map((workout) => ({
          value: String(workout.id),
          label: workout.name,
        }))}
        onChange={(value) => setSelectedWorkoutId(Number(value))}
      />

      <View style={styles.gap} />
      <DropdownField
        label="PERSON"
        value={person}
        placeholder="Thejus"
        emptyText=""
        options={PEOPLE.map((item) => ({ value: item.id, label: item.label }))}
        onChange={(value) => setPerson(value === 'lekshmi' ? 'lekshmi' : 'thejus')}
      />

      <Text style={styles.setLabel}>
        SET {upcoming} · {personLabel(person).toUpperCase()}
      </Text>
      <View style={styles.numbers}>
        <NumberField
          label="WEIGHT · KG"
          value={weight}
          error={errors.weight}
          keyboard="decimal-pad"
          onChange={(text) => {
            setWeight(text);
            setErrors((current) => ({ ...current, weight: undefined }));
          }}
        />
        <NumberField
          label="REPS"
          value={reps}
          error={errors.reps}
          keyboard="number-pad"
          onChange={(text) => {
            setReps(text);
            setErrors((current) => ({ ...current, reps: undefined }));
          }}
        />
        <NumberField
          label="RIR"
          value={rir}
          error={errors.rir}
          keyboard="number-pad"
          onChange={(text) => {
            setRir(text);
            setErrors((current) => ({ ...current, rir: undefined }));
          }}
        />
      </View>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add set"
        onPress={() => void onAdd()}
        style={[styles.button, saving && styles.buttonBusy]}
      >
        <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Add set'}</Text>
      </Pressable>
      <Text style={styles.logged}>{loggedLabel}</Text>
    </View>
  );
}

function NumberField({
  label,
  value,
  error,
  keyboard,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  keyboard: 'decimal-pad' | 'number-pad';
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.numberWrap}>
      <Text style={styles.numberLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder="—"
        placeholderTextColor={colors.placeholder}
        style={[styles.numberInput, error ? styles.numberInputError : null]}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subhead: {
    marginTop: 6,
    marginBottom: 18,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  gap: {
    height: 16,
  },
  setLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.label,
  },
  numbers: {
    flexDirection: 'row',
    gap: 10,
  },
  numberWrap: {
    flex: 1,
  },
  numberLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.label,
    marginBottom: 8,
  },
  numberInput: {
    minHeight: 64,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  numberInputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  formError: {
    marginTop: 12,
    color: colors.danger,
    fontSize: 14,
  },
  button: {
    marginTop: 22,
    minHeight: 58,
    borderRadius: radius.button,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logged: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
});

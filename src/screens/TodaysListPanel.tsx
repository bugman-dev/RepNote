import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatSessionExport, formatSetLine } from '../domain/formatExport';
import { groupSets, setsForPerson } from '../domain/sessionView';
import { personLabel, type Person } from '../domain/types';
import { useSession } from '../state/SessionStore';
import { colors, radius } from '../theme';

export function TodaysListPanel() {
  const { routineDay, sessionDate, sets, sessionStatus, exportSession } = useSession();
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const groups = groupSets(sets);
  const preview = formatSessionExport(routineDay, sessionDate, sets);
  const canExport = sessionStatus === 'ready' && !exporting;
  const awaitingSets = sets.length === 0 && sessionStatus !== 'ready';
  const summary = awaitingSets
    ? sessionStatus === 'loading'
      ? 'Loading…'
      : ''
    : `${groups.length} ${groups.length === 1 ? 'exercise' : 'exercises'} · ${sets.length} ${
        sets.length === 1 ? 'set' : 'sets'
      }`;

  const onExport = async () => {
    if (exporting || sessionStatus !== 'ready') {
      return;
    }
    setExporting(true);
    setStatus(null);
    try {
      const result = await exportSession();
      if (!result.cancelled) {
        setStatusIsError(false);
        setStatus('Text file saved');
      }
    } catch (error) {
      setStatusIsError(true);
      setStatus(error instanceof Error ? error.message : 'Could not save the text file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.heading}>Today’s workouts</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      {sessionStatus === 'loading' && sets.length === 0 ? (
        <Text style={styles.empty}>Loading this day…</Text>
      ) : null}
      {sessionStatus === 'ready' && groups.length === 0 ? (
        <Text style={styles.empty}>No sets for this day yet.</Text>
      ) : null}
      {groups.map((group) => (
        <View key={group.workoutId} style={styles.group}>
          <View style={styles.groupHeader}>
            <Text style={styles.workout}>{group.name}</Text>
            <Text style={styles.count}>
              {group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}
            </Text>
          </View>
          <PersonBlock person="thejus" sets={setsForPerson(group.sets, 'thejus')} />
          <PersonBlock person="lekshmi" sets={setsForPerson(group.sets, 'lekshmi')} />
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export today as text"
        accessibilityState={{ disabled: !canExport }}
        disabled={!canExport}
        onPress={() => void onExport()}
        style={[styles.exportButton, !canExport && styles.exportBusy]}
      >
        <Text style={styles.exportLabel}>
          {exporting ? 'Saving…' : sessionStatus === 'loading' ? 'Loading…' : 'Export today as .txt'}
        </Text>
      </Pressable>
      {status ? (
        statusIsError ? (
          <Text style={[styles.status, styles.statusError]}>{status}</Text>
        ) : (
          <View style={styles.statusRow}>
            <Text style={styles.tick}>✓</Text>
            <Text style={styles.status}>{status}</Text>
          </View>
        )
      ) : null}

      {sessionStatus === 'ready' ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Text file preview</Text>
          <Text style={styles.previewBody}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

function PersonBlock({
  person,
  sets,
}: {
  person: Person;
  sets: ReturnType<typeof setsForPerson>;
}) {
  if (sets.length === 0) {
    return null;
  }
  return (
    <View style={styles.personBlock}>
      <Text style={styles.person}>{personLabel(person)}</Text>
      {sets.map((set) => (
        <Text key={set.id} style={styles.setLine}>
          {formatSetLine(set)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  heading: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  summary: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  group: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  workout: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  count: {
    color: colors.muted,
    fontSize: 13,
  },
  personBlock: {
    marginTop: 10,
  },
  person: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  setLine: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  exportButton: {
    marginTop: 22,
    minHeight: 58,
    borderRadius: radius.button,
    backgroundColor: colors.export,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBusy: {
    opacity: 0.7,
  },
  exportLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tick: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    color: colors.pillText,
    fontSize: 14,
    fontWeight: '600',
  },
  statusError: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.danger,
  },
  preview: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    minHeight: 180,
  },
  previewLabel: {
    color: colors.pillText,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  previewBody: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
  },
});

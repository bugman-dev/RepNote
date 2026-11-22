import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { DateField } from '../components/DateField';
import { DropdownField } from '../components/DropdownField';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { ROUTINE_DAYS, formatDayLabel } from '../domain/types';
import { useSession } from '../state/SessionStore';
import { colors } from '../theme';
import { LogSetsPanel } from './LogSetsPanel';
import { TodaysListPanel } from './TodaysListPanel';

export function SessionScreen() {
  const {
    routineDay,
    setRoutineDay,
    sessionDate,
    setSessionDate,
    sessionError,
    workoutError,
    reloadSession,
    reloadWorkouts,
  } = useSession();
  const [tab, setTab] = useState<'log' | 'today'>('log');

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.meta}>
        <View style={styles.day}>
          <DropdownField
            label="ROUTINE DAY"
            value={String(routineDay)}
            placeholder="Day 01"
            emptyText=""
            options={ROUTINE_DAYS.map((day) => ({
              value: String(day),
              label: formatDayLabel(day),
            }))}
            onChange={(value) => setRoutineDay(Number(value))}
          />
        </View>
        <DateField value={sessionDate} onChange={setSessionDate} />
      </View>
      {workoutError ? (
        <LoadNotice message={workoutError} onRetry={() => void reloadWorkouts()} />
      ) : null}
      {sessionError ? (
        <LoadNotice message={sessionError} onRetry={() => void reloadSession()} />
      ) : null}
      <SegmentedTabs value={tab} onChange={setTab} />
      {tab === 'log' ? <LogSetsPanel /> : <TodaysListPanel />}
      <Text style={styles.footer}>
        {Constants.expoConfig?.name} · App Version {Constants.expoConfig?.version}
      </Text>
    </ScrollView>
  );
}

function LoadNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry}>
        <Text style={styles.retry}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  day: {
    flex: 0.8,
  },
  notice: {
    marginBottom: 14,
    gap: 6,
  },
  noticeText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  retry: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 36,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
  },
});

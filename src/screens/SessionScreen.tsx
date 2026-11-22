import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateField } from '../components/DateField';
import { DropdownField } from '../components/DropdownField';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { ROUTINE_DAYS, formatDayLabel } from '../domain/types';
import { useSession } from '../state/SessionStore';
import { colors } from '../theme';
import { LogSetsPanel } from './LogSetsPanel';
import { TodaysListPanel } from './TodaysListPanel';

export function SessionScreen() {
  const { routineDay, setRoutineDay, sessionDate, setSessionDate } = useSession();
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
      <SegmentedTabs value={tab} onChange={setTab} />
      {tab === 'log' ? <LogSetsPanel /> : <TodaysListPanel />}
      <Text style={styles.footer}>Saved on this device · no typing workout names</Text>
    </ScrollView>
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
  footer: {
    marginTop: 36,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
  },
});

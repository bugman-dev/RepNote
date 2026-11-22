import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export function SegmentedTabs({
  value,
  onChange,
}: {
  value: 'log' | 'today';
  onChange: (value: 'log' | 'today') => void;
}) {
  return (
    <View style={styles.track}>
      <Tab label="Log sets" active={value === 'log'} onPress={() => onChange('log')} />
      <Tab label="Today’s list" active={value === 'today'} onPress={() => onChange('today')} />
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.greenSoft,
    borderRadius: radius.field,
    padding: 4,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.ink,
  },
  labelIdle: {
    color: colors.muted,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { colors, radius } from '../theme';

export function AppHeader({ onPressMenu }: { onPressMenu: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{Constants.expoConfig?.name}</Text>
      <View style={styles.actions}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>8-day cycle</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open options"
          onPress={onPressMenu}
          style={styles.menu}
        >
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    backgroundColor: colors.pill,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    color: colors.pillText,
    fontSize: 13,
    fontWeight: '600',
  },
  menu: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.ink,
  },
});

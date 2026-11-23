import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export function OptionsDrawer({
  visible,
  onClose,
  onManageWorkouts,
  onManagePeople,
}: {
  visible: boolean;
  onClose: () => void;
  onManageWorkouts: () => void;
  onManagePeople: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.row}>
        <Pressable accessibilityLabel="Close options" style={styles.scrim} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Options</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close options"
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.closeLabel}>×</Text>
            </Pressable>
          </View>
          <View style={styles.rule} />
          <View style={styles.menu}>
            <Pressable
              accessibilityRole="button"
              onPress={onManageWorkouts}
              style={styles.item}
            >
              <Text style={styles.itemLabel}>Manage workout names</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onManagePeople}
              style={styles.item}
            >
              <Text style={styles.itemLabel}>Manage people</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  scrim: {
    flex: 0.32,
    backgroundColor: colors.overlay,
  },
  panel: {
    flex: 0.68,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontSize: 26,
    lineHeight: 28,
    color: colors.ink,
  },
  rule: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 16,
    marginBottom: 18,
  },
  menu: {
    gap: 10,
  },
  item: {
    backgroundColor: colors.background,
    borderRadius: radius.field,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
});

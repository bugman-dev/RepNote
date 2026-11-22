import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export type DropdownOption = {
  value: string;
  label: string;
};

export function DropdownField({
  label,
  value,
  placeholder,
  options,
  emptyText,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: DropdownOption[];
  emptyText: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.length === 0 ? (
              <Text style={styles.empty}>{emptyText}</Text>
            ) : (
              <ScrollView style={styles.list}>
                {options.map((option) => {
                  const active = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.label,
    marginBottom: 8,
  },
  field: {
    minHeight: 56,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  placeholder: {
    color: colors.muted,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
    color: colors.muted,
    fontSize: 14,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.label,
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: colors.greenSoft,
  },
  optionLabel: {
    fontSize: 17,
    color: colors.ink,
  },
  optionLabelActive: {
    fontWeight: '700',
    color: colors.green,
  },
  empty: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
    paddingVertical: 8,
  },
});

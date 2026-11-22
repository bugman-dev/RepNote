import { createElement, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { dateToIso, formatLongDate, isoToDate } from '../domain/dates';
import { colors, radius } from '../theme';

export function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    onChange(dateToIso(date));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>SESSION DATE</Text>
      <View style={styles.field}>
        <Text style={styles.value}>{formatLongDate(value)}</Text>
        {Platform.OS === 'web' ? (
          createElement('input', {
            type: 'date',
            value,
            'aria-label': 'Session date',
            onChange: (event: { target: { value: string } }) => {
              if (event.target.value) {
                onChange(event.target.value);
              }
            },
            style: webInputStyle,
          })
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Session date"
            onPress={() => setOpen(true)}
            style={styles.hit}
          />
        )}
      </View>
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={isoToDate(value)} mode="date" onChange={onPickerChange} />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <DateTimePicker
                value={isoToDate(value)}
                mode="date"
                display="spinner"
                onChange={onPickerChange}
              />
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.done}>
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const webInputStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1.4,
  },
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
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  hit: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    padding: 16,
  },
  done: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  doneLabel: {
    color: colors.green,
    fontSize: 17,
    fontWeight: '700',
  },
});

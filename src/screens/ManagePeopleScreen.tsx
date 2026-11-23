import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSession } from '../state/SessionStore';
import { colors, radius } from '../theme';

export function ManagePeopleScreen() {
  const { people, addPerson, deletePerson, showSession, personError, reloadPeople } = useSession();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const countLabel =
    personError && people.length === 0
      ? 'People could not be loaded'
      : `${people.length} ${people.length === 1 ? 'person' : 'people'} available`;

  const onAdd = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    const result = await addPerson(name);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName('');
    setError(null);
  };

  const confirmDelete = async () => {
    const pending = pendingDelete;
    if (!pending || deletingId != null) {
      return;
    }
    setPendingDelete(null);
    setDeletingId(pending.id);
    setDeleteError(null);
    try {
      await deletePerson(pending.id);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : 'Could not delete that person');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={showSession} style={styles.back}>
        <Text style={styles.backLabel}>←  Back to workout</Text>
      </Pressable>
      <Text style={styles.heading}>Manage people</Text>
      <Text style={styles.subhead}>
        Add a name once. It will be ready in the Person dropdown when you log a set.
      </Text>
      <Text style={styles.fieldLabel}>NEW PERSON NAME</Text>
      <TextInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="e.g. Thejus"
        placeholderTextColor={colors.placeholder}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityLabel="New person name"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => void onAdd()}
        style={[styles.button, saving && styles.buttonBusy]}
      >
        <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Add person'}</Text>
      </Pressable>
      <Text style={styles.count}>{countLabel}</Text>
      <View style={styles.rule} />
      <Text style={styles.listHeading}>Saved people</Text>
      {personError ? (
        <View style={styles.errorRow}>
          <Text style={styles.error}>{personError}</Text>
          <Pressable accessibilityRole="button" onPress={() => void reloadPeople()}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {people.length === 0 ? (
        personError ? null : <Text style={styles.empty}>Names you add will show up here.</Text>
      ) : (
        people.map((person) => (
          <View key={person.id} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.name}>{person.name}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${person.name}`}
              disabled={deletingId != null}
              onPress={() => setPendingDelete({ id: person.id, name: person.name })}
              hitSlop={6}
              style={[styles.deleteButton, deletingId === person.id && styles.deleteBusy]}
            >
              <TrashIcon />
            </Pressable>
          </View>
        ))
      )}
      {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
      <Modal
        visible={pendingDelete != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDelete(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPendingDelete(null)}>
          <Pressable style={styles.confirmSheet} onPress={() => undefined}>
            <Text style={styles.confirmTitle}>Delete this person?</Text>
            <Text style={styles.confirmBody}>
              {pendingDelete?.name}
              {'\n'}Sets already logged keep this name.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingDelete(null)}
                style={styles.confirmCancel}
              >
                <Text style={styles.confirmCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void confirmDelete()}
                style={styles.confirmDelete}
              >
                <Text style={styles.confirmDeleteLabel}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function TrashIcon() {
  return (
    <View style={styles.trash}>
      <View style={styles.trashHandle} />
      <View style={styles.trashLid} />
      <View style={styles.trashBody} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  back: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 22,
  },
  backLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subhead: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.label,
    marginBottom: 8,
  },
  input: {
    minHeight: 56,
    borderRadius: radius.field,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.ink,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: 8,
    color: colors.danger,
    fontSize: 14,
  },
  errorRow: {
    marginBottom: 12,
    gap: 6,
  },
  retry: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    marginTop: 16,
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
  count: {
    marginTop: 18,
    color: colors.muted,
    fontSize: 14,
  },
  rule: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 16,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
  },
  empty: {
    color: colors.muted,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
  },
  deleteButton: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBusy: {
    opacity: 0.4,
  },
  trash: {
    width: 16,
    height: 18,
    alignItems: 'center',
  },
  trashHandle: {
    width: 6,
    height: 2,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.muted,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  trashLid: {
    width: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.muted,
    marginTop: 1,
  },
  trashBody: {
    width: 10,
    height: 11,
    marginTop: 1,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.muted,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  confirmSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  confirmBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  confirmCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },
  confirmCancelLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmDelete: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.export,
  },
  confirmDeleteLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

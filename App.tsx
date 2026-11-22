import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabase } from './src/data/db';
import { Root } from './src/screens/Root';
import { SessionProvider } from './src/state/SessionStore';
import { colors } from './src/theme';

export default function App() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let database: SQLiteDatabase | null = null;
    (async () => {
      try {
        database = await openDatabase();
        if (!active) {
          await database.closeAsync();
          return;
        }
        setDb(database);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not open saved workouts');
        }
      }
    })();
    return () => {
      active = false;
      void database?.closeAsync();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : db ? (
        <SessionProvider db={db}>
          <Root />
        </SessionProvider>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={colors.green} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
});

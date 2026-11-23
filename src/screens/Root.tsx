import { useEffect } from 'react';
import { BackHandler, Platform, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { OptionsDrawer } from '../components/OptionsDrawer';
import { useSession } from '../state/SessionStore';
import { colors } from '../theme';
import { ManagePeopleScreen } from './ManagePeopleScreen';
import { ManageWorkoutsScreen } from './ManageWorkoutsScreen';
import { SessionScreen } from './SessionScreen';

export function Root() {
  const { screen, drawerOpen, openDrawer, closeDrawer, showWorkouts, showPeople, showSession } =
    useSession();
  const topInset = Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 0) : 16;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerOpen) {
        closeDrawer();
        return true;
      }
      if (screen === 'workouts' || screen === 'people') {
        showSession();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [closeDrawer, drawerOpen, screen, showSession]);

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <AppHeader onPressMenu={openDrawer} />
      {screen === 'workouts' ? (
        <ManageWorkoutsScreen />
      ) : screen === 'people' ? (
        <ManagePeopleScreen />
      ) : (
        <SessionScreen />
      )}
      <OptionsDrawer
        visible={drawerOpen}
        onClose={closeDrawer}
        onManageWorkouts={showWorkouts}
        onManagePeople={showPeople}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
});

import { Stack } from 'expo-router';

/** Force-hide the tab navigator header on this screen (Expo Go). */
export function HideScreenHeader() {
  return (
    <Stack.Screen
      options={{
        headerShown: false,
        title: '',
        headerTitle: '',
        header: () => null,
      }}
    />
  );
}

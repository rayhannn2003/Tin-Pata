import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from '@/i18n/I18nProvider';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { DatabaseProvider } from '@/hooks/useDatabase';
import { ThemeProvider, useThemeContext } from '@/hooks/ThemeProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WebPreviewBanner } from '@/components/ui/WebPreviewBanner';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function SplashGate({ fontsLoaded, children }: { fontsLoaded: boolean; children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: themeLoading } = useThemeContext();

  useEffect(() => {
    if (fontsLoaded && !authLoading && !themeLoading) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading, themeLoading]);

  if (!fontsLoaded || authLoading || themeLoading) {
    return null;
  }

  return children;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <DatabaseProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <SplashGate fontsLoaded={loaded}>
              <RootStack />
            </SplashGate>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </DatabaseProvider>
  );
}

function RootStack() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <WebPreviewBanner />
      <Stack screenOptions={{ headerShown: false, header: () => null }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="book/[bookId]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="reader/[bookId]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="notes/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="bookmarks/index"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

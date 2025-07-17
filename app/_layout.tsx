import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { AuthProvider } from '@/components/AuthContext';
import AuthGate from '@/components/AuthGate';
import { useColorScheme } from '@/hooks/useColorScheme';
import { requestNotificationPermissions, scheduleNightlyNotifications } from '../components/notifications';

export default function RootLayout(props) {
  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleNightlyNotifications();
      }
    })();
  }, []);
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <PaperProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

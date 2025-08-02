import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/components/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { requestNotificationPermissions, scheduleNightlyNotifications } from '../components/notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded && !__DEV__) {
      (async () => {
        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleNightlyNotifications();
        }
      })();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
                },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
                          <Stack.Screen name="staff" />
            <Stack.Screen name="hotel-orient-elite-maintenance-payments" />
            <Stack.Screen name="hotel-orient-elite-all-vendor-payments" />
              <Stack.Screen 
                name="+not-found" 
                options={{
                  presentation: 'modal',
                }}
              />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="hotel-orient-elite"
        options={{
          title: 'Hotel Orient Elite',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="house.fill" color={focused ? '#6CA8F7' : '#888'} />,
        }}
      />
      <Tabs.Screen
        name="hotel-ojas"
        options={{
          title: 'Hotel Ojas',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="star.fill" color={focused ? '#1976d2' : '#888'} />,
        }}
      />
      <Tabs.Screen
        name="catena-cafe"
        options={{
          title: 'Catena Cafe',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="cup.and.saucer.fill" color={focused ? '#43a047' : '#888'} />,
        }}
      />
    </Tabs>
  );
}

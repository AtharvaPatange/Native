import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/components/AuthContext';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const ORIENT_PRIMARY = '#e0a86b';
const ORIENT_SECONDARY = '#e2af7a';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole, loading } = useAuth();

  // Don't render tabs while loading to prevent flashing
  if (loading) {
    return null;
  }

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
        name="index"
        options={{
          title: 'Hotel Orient Elite',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="house.fill" color={focused ? ORIENT_PRIMARY : ORIENT_SECONDARY} />,
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="person.crop.circle.fill" color={focused ? '#1976d2' : '#888'} />, // user icon
        }}
      />
      {userRole === 'globalAdmin' && (
        <Tabs.Screen
          name="others"
          options={{
            title: 'Others',
            tabBarIcon: ({ focused }) => <IconSymbol size={28} name="ellipsis.circle.fill" color={focused ? '#9c27b0' : '#888'} />,
          }}
        />
      )}
    </Tabs>
  );
}

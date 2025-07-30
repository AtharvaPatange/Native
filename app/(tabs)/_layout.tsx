import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { useAuth } from '@/components/AuthContext';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const ORIENT_PRIMARY = '#e0a86b';
const ORIENT_SECONDARY = '#e2af7a';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole, loading } = useAuth();

  console.log('TabLayout - Loading:', loading, 'User:', userRole);

  // Show loading spinner while loading
  if (loading) {
    console.log('TabLayout - Showing loading spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ORIENT_PRIMARY} />
      </View>
    );
  }

  console.log('TabLayout - Rendering tabs');
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
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
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="house.fill" color={focused ? '#000000' : '#666666'} />,
        }}
      />
      <Tabs.Screen
        name="hotel-ojas"
        options={{
          title: 'Hotel Ojas',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="star.fill" color={focused ? '#000000' : '#666666'} />,
        }}
      />
      <Tabs.Screen
        name="catena-cafe"
        options={{
          title: 'Catena Cafe',
          tabBarIcon: ({ focused }) => <IconSymbol size={28} name="cup.and.saucer.fill" color={focused ? '#000000' : '#666666'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
      <AntDesign name="profile" size={24} color={focused ? '#000000' : '#666666'} />
          ),
        }}
      />
      {userRole === 'globalAdmin' && (
        <Tabs.Screen
          name="others"
          options={{
            title: 'Others',
            tabBarIcon: ({ focused }) => (
              <Entypo name="dots-three-vertical" size={24} color={focused ? '#000000' : '#666666'} />),
          }}
        />
      )}
    </Tabs>
  );
}

import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useUserStore } from '../zustand';

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
  
  // Get workSection inside the component so it updates reactively
  const workSection = useUserStore((state) => state.workSection);
  
  console.log('TabLayout - Loading:', loading, 'User Role:', userRole, 'Work Section:', workSection);

  // Show loading spinner while loading
  if (loading) {
    console.log('TabLayout - Showing loading spinner');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ORIENT_PRIMARY} />
      </View>
    );
  }

  // Helper function to check if user should see a tab
  const shouldShowTab = (tabName: any) => {
    if (userRole === 'globalAdmin') {
      return true; // Global admin sees everything
    }
    // For admin users, only show their assigned section
    switch (tabName) {
      case 'hotel-orient':
        return workSection === 'orientElite';
      case 'hotel-ojas':
        return workSection === 'ojas';
      case 'catena-cafe':
        return workSection === 'catenaCafe';
      default:
        return true; // Show profile and other general tabs
    }
  };

  console.log('TabLayout - Rendering tabs for role:', userRole, 'workSection:', workSection);
  
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
      
      {/* Hotel Orient Elite - Show for orientElite users and global admin */}
      {shouldShowTab('hotel-orient') && (
        <Tabs.Screen
          name="orient-elite"
          options={{
            title: 'Hotel Orient Elite',
            tabBarIcon: ({ focused }) => <IconSymbol size={28} name="house.fill" color={focused ? '#000000' : '#666666'} />,
          }}
        />
      )}

      {/* Hotel Ojas - Show only for ojas users and global admin */}
      {shouldShowTab('hotel-ojas') && (
        <Tabs.Screen
          name="hotel-ojas"
          options={{
            title: 'Hotel Ojas',
            tabBarIcon: ({ focused }) => <IconSymbol size={28} name="star.fill" color={focused ? '#000000' : '#666666'} />,
          }}
        />
      )}

      {/* Catena Cafe - Show only for catenaCafe users and global admin */}
      {shouldShowTab('catena-cafe') && (
        <Tabs.Screen
          name="catena-cafe"
          options={{
            title: 'Catena Cafe',
            tabBarIcon: ({ focused }) => <IconSymbol size={28} name="cup.and.saucer.fill" color={focused ? '#000000' : '#666666'} />,
          }}
        />
      )}

      {/* Profile - Show for everyone */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <AntDesign name="profile" size={24} color={focused ? '#000000' : '#666666'} />
          ),
        }}
      />

      {/* Others - Show only for global admin */}
      {userRole === 'globalAdmin' && (
        <Tabs.Screen
          name="others"
          options={{
            title: 'Others',
            tabBarIcon: ({ focused }) => (
              <Entypo name="dots-three-vertical" size={24} color={focused ? '#000000' : '#666666'} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
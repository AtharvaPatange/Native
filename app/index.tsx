import { useAuth } from '@/components/AuthContext';
import CustomSplashScreen from '@/components/CustomSplashScreen';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Show custom splash screen on first load
  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0a86b' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // If user is authenticated, go to tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // If no user, go to auth
  return <Redirect href="/auth" />;
} 
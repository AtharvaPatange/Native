import { useAuth } from '@/components/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

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
import { useAuth } from '@/components/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function NavigationRoot() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e0a86b" />
      </View>
    );
  }

  // Only redirect to tabs if user is authenticated
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, show auth screen
  return <Redirect href="/auth" />;
}

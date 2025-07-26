import { auth, db } from '@/constants/firebaseConfig';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Avatar, Button, Surface, Text, TextInput } from 'react-native-paper';
import { useAuth } from './AuthContext';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  
  if (!user) {
    return (
      <KeyboardAvoidingView
        style={styles.bg}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centered}>
          <Surface style={styles.card} elevation={5}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Avatar.Icon size={64} icon={isRegister ? 'account-plus' : 'login'} color="#fff" style={{ backgroundColor: '#1976d2' }} />
            </View>
            <Text style={styles.title}>{isRegister ? 'Create Account' : 'Sign In'}</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="lock" />}
            />
            {isRegister && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ marginBottom: 4, color: '#1976d2', fontWeight: 'bold' }}>Select Role</Text>
                <Picker
                  selectedValue={role}
                  onValueChange={setRole}
                  style={styles.picker}
                >
                  <Picker.Item label="Global Admin" value="globalAdmin" />
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Operator" value="operator" />
                </Picker>
              </View>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              mode="contained"
              onPress={async () => {
                setSubmitting(true);
                setError('');
                try {
                  if (isRegister) {
                    const cred = await createUserWithEmailAndPassword(auth, email, password);
                    // Save user role to Firestore
                    await setDoc(doc(db, 'users', cred.user.uid), {
                      email,
                      role,
                    });
                    // Show welcome notification
                    console.log('Attempting to show welcome notification after registration');
                    try {
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: 'Welcome',
                          body: 'Welcome to the app!',
                          sound: true,
                        },
                        trigger: null,
                      });
                    } catch (e) {
                      console.log('Notification error after registration:', e);
                    }
                  } else {
                    await signInWithEmailAndPassword(auth, email, password);
                    // Show welcome notification
                    console.log('Attempting to show welcome notification after login');
                    try {
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: 'Welcome Back',
                          body: 'You have successfully logged in!',
                          sound: true,
                        },
                        trigger: null,
                      });
                    } catch (e) {
                      console.log('Notification error after login:', e);
                    }
                  }
                } catch (err: any) {
                  setError(err.message || 'Authentication failed');
                } finally {
                  setSubmitting(false);
                }
              }}
              loading={submitting}
              disabled={submitting}
              style={styles.button}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsRegister(!isRegister)}
              style={styles.switchButton}
            >
              {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </Button>
          </Surface>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  bg: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  switchButton: {
    marginTop: 16,
  },
}); 
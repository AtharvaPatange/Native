import { auth, db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { useAuth } from './AuthContext';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

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
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.centered}>
          <Surface style={styles.card} elevation={5}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <LinearGradient
                colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
                style={styles.avatarBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={isRegister ? 'account-plus' : 'login'}
                  size={40}
                  color="#fff"
                />
              </LinearGradient>
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
              outlineColor={PRIMARY_COLOR}
              activeOutlineColor={SECONDARY_COLOR}
              left={<TextInput.Icon icon="email" color={PRIMARY_COLOR} />}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              outlineColor={PRIMARY_COLOR}
              activeOutlineColor={SECONDARY_COLOR}
              left={<TextInput.Icon icon="lock" color={PRIMARY_COLOR} />}
            />
            {isRegister && (
              <View style={styles.roleContainer}>
                <Text style={[styles.roleLabel, { color: PRIMARY_COLOR }]}>Select Role</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={role}
                    onValueChange={setRole}
                    style={styles.picker}
                  >
                    <Picker.Item label="Global Admin" value="globalAdmin" color={PRIMARY_COLOR} />
                    <Picker.Item label="Admin" value="admin" color={PRIMARY_COLOR} />
                    <Picker.Item label="Operator" value="operator" color={PRIMARY_COLOR} />
                  </Picker>
                </View>
              </View>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              mode="contained"
              buttonColor={PRIMARY_COLOR}
              textColor="#fff"
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
                      createdAt: new Date(),
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
                    // Navigate to tabs after successful registration
                    router.replace('/(tabs)');
                  } else {
                    await signInWithEmailAndPassword(auth, email, password);
                    // Navigate to tabs first
                    router.replace('/(tabs)');
                    
                    // Then show welcome notification
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
              textColor={SECONDARY_COLOR}
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
    backgroundColor: PRIMARY_COLOR,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  bg: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: PRIMARY_COLOR,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  switchButton: {
    marginTop: 16,
  },
}); 
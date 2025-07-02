import { auth, db } from '@/constants/firebaseConfig';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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

  if (loading) return <Text>Loading...</Text>;
  if (!user) {
    return (
      <KeyboardAvoidingView
        style={styles.bg}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.centered}>
          <Surface style={styles.card} elevation={6}>
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
                  } else {
                    await signInWithEmailAndPassword(auth, email, password);
                  }
                } catch (e: any) {
                  setError(e.message || (isRegister ? 'Registration failed' : 'Login failed'));
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              style={styles.button}
              contentStyle={{ paddingVertical: 6 }}
            >
              {submitting ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
            </Button>
            <Button
              mode="text"
              onPress={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={styles.toggleBtn}
              labelStyle={{ color: '#1976d2', fontWeight: 'bold' }}
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </Button>
          </Surface>
        </View>
      </KeyboardAvoidingView>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#e3f0fc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: 340,
    borderRadius: 18,
    padding: 28,
    backgroundColor: '#fff',
    shadowColor: '#1976d2',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#1976d2',
  },
  input: {
    marginBottom: 14,
    backgroundColor: '#f5f6fa',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#1976d2',
  },
  toggleBtn: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    marginTop: 2,
  },
}); 
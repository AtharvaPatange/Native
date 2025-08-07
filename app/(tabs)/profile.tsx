// src/screens/ProfileScreen.tsx
import { useAuth } from '@/components/AuthContext';
import { useUserStore } from '../zustand';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Portal, Text, TextInput } from 'react-native-paper';

const ORIENT_ELITE_PRIMARY = '#e0a86b';
const ORIENT_ELITE_SECONDARY = '#e2af7a';
const OJAS_PRIMARY = '#8D6748';
const OJAS_SECONDARY = '#CBB292';
const CATENA_PRIMARY = '#7FB069';
const CATENA_SECONDARY = '#D4E6C3';
const PRIMARY_COLOR = ORIENT_ELITE_PRIMARY;

interface UserProfile {
  name: string;
  address: string;
  phone: string;
  workSection: string;
  email: string | null;
  role: string;
}

export default function ProfileScreen() {
  const { user, userRole, logout, loading } = useAuth();
  const { setWorkSection } = useUserStore();

  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    address: '',
    phone: '',
    workSection: '',
    email: user?.email || '',
    role: userRole || '',
  });

  useEffect(() => {
    if (user?.uid) {
      const fetchProfile = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(prev => ({
            ...prev,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            workSection: data.workSection || '',
            email: data.email || user?.email || '',
            role: data.role || userRole || '',
          }));
          setWorkSection(data.workSection || '');
        }
      };
      fetchProfile();
    }
  }, [user?.uid, userRole]);

  const getThemeColors = (workSection: string) => {
    switch (workSection) {
      case 'orientElite':
        return { primary: ORIENT_ELITE_PRIMARY, secondary: ORIENT_ELITE_SECONDARY };
      case 'ojas':
        return { primary: OJAS_PRIMARY, secondary: OJAS_SECONDARY };
      case 'catenaCafe':
        return { primary: CATENA_PRIMARY, secondary: CATENA_SECONDARY };
      default:
        return { primary: ORIENT_ELITE_PRIMARY, secondary: ORIENT_ELITE_SECONDARY };
    }
  };

  const themeColors = getThemeColors(profile.workSection);

  const handleSaveProfile = async () => {
    if (!user?.uid) return Alert.alert('Error', 'User not authenticated');
    if (!profile.name.trim() || !profile.phone.trim()) return Alert.alert('Error', 'Fill in all fields');

    setProfileLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        updatedAt: new Date(),
      }, { merge: true });
      setModalVisible(false);
      setIsEditing(false);
      setWorkSection(profile.workSection);
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const sectionOptions = [
    { label: 'Orient Elite', value: 'orientElite' },
    { label: 'Ojas', value: 'ojas' },
    { label: 'Catena Cafe', value: 'catenaCafe' },
  ];
  const visibleSectionOptions = profile.role === 'globalAdmin'
    ? sectionOptions
    : sectionOptions.filter(opt => opt.value === profile.workSection);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Welcome, {profile.name || 'User'}!</Text>
            <Text style={styles.label}>Email: <Text style={styles.value}>{profile.email}</Text></Text>
            <Text style={styles.label}>Phone: <Text style={styles.value}>{profile.phone}</Text></Text>
            <Text style={styles.label}>Work Section: <Text style={styles.value}>{profile.workSection}</Text></Text>
            <Text style={styles.label}>Role: <Text style={styles.value}>{profile.role}</Text></Text>

            <Button
              onPress={() => setModalVisible(true)}
              mode="contained"
              style={styles.button}
            >Edit Profile</Button>

            <Button
              onPress={() => logout(() => router.replace('/auth'))}
              mode="contained"
              style={[styles.button, styles.logoutButton]}
            >Logout</Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal visible={modalVisible} animationType="slide">
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              label="Full Name"
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={profile.phone}
              onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text.replace(/\D/g, '') }))}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
            <TextInput
              label="Address"
              value={profile.address}
              onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
              style={styles.input}
            />
            <Text style={styles.pickerLabel}>Work Section</Text>
            <Picker
              selectedValue={profile.workSection}
              onValueChange={value => setProfile(prev => ({ ...prev, workSection: value }))}
              enabled={profile.role === 'globalAdmin'}
              style={styles.picker}
            >
              {visibleSectionOptions.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
            <Button loading={profileLoading} onPress={handleSaveProfile} mode="contained" style={styles.button}>Save</Button>
            <Button onPress={() => setModalVisible(false)} mode="outlined" style={styles.button}>Cancel</Button>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    fontWeight: '400',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#c62828',
  },
  modalContent: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  input: {
    marginBottom: 12,
  },
  pickerLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: '#eee',
    marginVertical: 8,
  },
});
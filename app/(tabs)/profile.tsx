import { useAuth } from '@/components/AuthContext';
import { auth, db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Portal, Text, TextInput } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

interface UserProfile {
  name: string;
  address: string;
  phone: string;
  workSection: string;
  email: string;
  role: string;
}

export default function ProfileScreen() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    address: '',
    phone: '',
    workSection: '',
    email: user?.email || '',
    role: userRole || '',
  });

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile(prev => ({
              ...prev,
              name: data.name || '',
              address: data.address || '',
              phone: data.phone || '',
              workSection: data.workSection || '',
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchProfile();
  }, [user?.uid]);

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!profile.name.trim() || !profile.phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(profile.phone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        phone: profile.phone.replace(/\D/g, ''), // Store only digits
        updatedAt: new Date(),
      }, { merge: true });
      
      Alert.alert('Success', 'Profile saved successfully!');
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (digitsOnly.length <= 10) {
      setProfile(prev => ({ ...prev, phone: digitsOnly }));
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    }
    return digitsOnly;
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (e) {
              Alert.alert('Logout Failed', 'Could not log out.');
            }
          }
        }
      ]
    );
  };

  const getWorkSectionDisplayName = (section: string) => {
    switch (section) {
      case 'orientElite': return 'Hotel Orient Elite';
      case 'ojas': return 'Hotel Ojas';
      case 'catenaCafe': return 'Catena Cafe';
      default: return 'Not specified';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'globalAdmin': return 'Global Administrator';
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      default: return role || 'Not assigned';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Large User Icon with Name */}
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons 
              name="account-circle" 
              size={100} 
              color={PRIMARY_COLOR} 
            />
          </View>
          <Text style={styles.userName}>{profile.name || 'User Profile'}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Title 
            title="Profile Information" 
            titleStyle={styles.cardTitle}
            style={styles.cardHeader}
            left={(props) => <MaterialCommunityIcons {...props} name="account-details" size={24} color="#fff" />}
          />
          <Card.Content style={styles.cardContent}>
            <View style={styles.profileSection}>
              <View style={styles.profileRow}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="account" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.label}>Full Name</Text>
                </View>
                <Text style={styles.value}>{profile.name || 'Not set'}</Text>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="phone" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.label}>Phone</Text>
                </View>
                <Text style={styles.value}>{profile.phone ? formatPhoneNumber(profile.phone) : 'Not set'}</Text>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.label}>Address</Text>
                </View>
                <Text style={styles.value}>{profile.address || 'Not set'}</Text>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="briefcase" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.label}>Work Section</Text>
                </View>
                <Text style={styles.value}>{getWorkSectionDisplayName(profile.workSection)}</Text>
              </View>

              <View style={styles.profileRow}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="shield-account" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.label}>Role</Text>
                </View>
                <Text style={styles.value}>{getRoleDisplayName(profile.role)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            style={styles.createProfileButton} 
            onPress={() => setModalVisible(true)}
            buttonColor={PRIMARY_COLOR}
            icon="account-edit"
            contentStyle={styles.buttonContent}
          >
            Create/Edit Profile
          </Button>
          
          <Button 
            mode="contained" 
            style={styles.logoutButton} 
            onPress={handleLogout}
            buttonColor="#e74c3c"
            icon="logout"
            contentStyle={styles.buttonContent}
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Create/Edit Profile Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Card style={styles.modalCard}>
                <Card.Title 
                  title="Create/Edit Profile" 
                  titleStyle={styles.modalTitle}
                  style={styles.modalHeader}
                  left={(props) => <MaterialCommunityIcons {...props} name="account-edit" size={24} color="#fff" />}
                />
                <Card.Content style={styles.modalCardContent}>
                  <TextInput
                    label="Full Name *"
                    value={profile.name}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                    style={styles.modalInput}
                    mode="outlined"
                    outlineColor={PRIMARY_COLOR}
                    activeOutlineColor={PRIMARY_COLOR}
                    left={<TextInput.Icon icon="account" />}
                  />

                  <TextInput
                    label="Phone Number *"
                    value={profile.phone}
                    onChangeText={handlePhoneChange}
                    style={styles.modalInput}
                    mode="outlined"
                    outlineColor={PRIMARY_COLOR}
                    activeOutlineColor={PRIMARY_COLOR}
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon="phone" />}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                  />

                  <TextInput
                    label="Address"
                    value={profile.address}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
                    style={styles.modalInput}
                    mode="outlined"
                    outlineColor={PRIMARY_COLOR}
                    activeOutlineColor={PRIMARY_COLOR}
                    multiline
                    numberOfLines={3}
                    left={<TextInput.Icon icon="map-marker" />}
                  />

                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Work Section</Text>
                    <Picker
                      selectedValue={profile.workSection}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, workSection: value }))}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Work Section" value="" />
                      <Picker.Item label="Hotel Orient Elite" value="orientElite" />
                      <Picker.Item label="Hotel Ojas" value="ojas" />
                      <Picker.Item label="Catena Cafe" value="catenaCafe" />
                    </Picker>
                  </View>
                </Card.Content>
              </Card>

              <View style={styles.modalButtonContainer}>
                <Button 
                  mode="outlined" 
                  style={styles.modalCancelButton} 
                  onPress={() => setModalVisible(false)}
                  textColor={PRIMARY_COLOR}
                  outlineColor={PRIMARY_COLOR}
                  contentStyle={styles.modalButtonContent}
                >
                  Cancel
                </Button>
                
                <Button 
                  mode="contained" 
                  style={styles.modalSaveButton} 
                  onPress={handleSaveProfile}
                  loading={loading}
                  disabled={loading}
                  buttonColor={PRIMARY_COLOR}
                  contentStyle={styles.modalButtonContent}
                >
                  Save Profile
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed from gradient to white
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    backgroundColor: 'rgba(224, 168, 107, 0.1)',
    borderRadius: 60,
    padding: 10,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Changed color to dark
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(51, 51, 51, 0.8)', // Changed color to dark
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    backgroundColor: PRIMARY_COLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 24,
  },
  profileSection: {
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_COLOR,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  createProfileButton: {
    borderRadius: 12,
    elevation: 4,
  },
  logoutButton: {
    borderRadius: 12,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    backgroundColor: PRIMARY_COLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCardContent: {
    padding: 24,
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  picker: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButtonContent: {
    paddingVertical: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
  },
}); 
import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Portal, Text, TextInput } from 'react-native-paper';

// Color themes for different branches
const ORIENT_ELITE_PRIMARY = '#e0a86b';
const ORIENT_ELITE_SECONDARY = '#e2af7a';

const OJAS_PRIMARY = '#8D6748';
const OJAS_SECONDARY = '#CBB292';

const CATENA_PRIMARY = '#7FB069';
const CATENA_SECONDARY = '#D4E6C3';

// Default to Orient Elite theme
const PRIMARY_COLOR = ORIENT_ELITE_PRIMARY;
const SECONDARY_COLOR = ORIENT_ELITE_SECONDARY;

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
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    address: '',
    phone: '',
    workSection: '',
    email: user?.email || '',
    role: userRole || '',
  });

  // Function to get theme colors based on work section
  const getThemeColors = (workSection: string) => {
    switch (workSection) {
      case 'orientElite':
        return {
          primary: ORIENT_ELITE_PRIMARY,
          secondary: ORIENT_ELITE_SECONDARY,
        };
      case 'ojas':
        return {
          primary: OJAS_PRIMARY,
          secondary: OJAS_SECONDARY,
        };
      case 'catenaCafe':
        return {
          primary: CATENA_PRIMARY,
          secondary: CATENA_SECONDARY,
        };
      default:
        // Default to Orient Elite theme if no work section is specified
        return {
          primary: ORIENT_ELITE_PRIMARY,
          secondary: ORIENT_ELITE_SECONDARY,
        };
    }
  };

  // Get current theme colors
  const themeColors = getThemeColors(profile.workSection);

  // Debug logging
  console.log('Profile - Current userRole:', userRole);
  console.log('Profile - Current profile state:', profile);
  console.log('Profile - Current theme colors:', themeColors);

  // Update profile when userRole changes
  useEffect(() => {
    if (userRole) {
      setProfile(prev => ({
        ...prev,
        role: userRole,
      }));
    }
  }, [userRole]);

  // Update profile when user email changes
  useEffect(() => {
    if (user?.email) {
      setProfile(prev => ({
        ...prev,
        email: user.email,
      }));
    }
  }, [user?.email]);

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          console.log('Profile - Fetching profile for user:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('Profile - User data fetched:', data);
            setProfile(prev => ({
              ...prev,
              name: data.name || '',
              address: data.address || '',
              phone: data.phone || '',
              workSection: data.workSection || '',
              email: data.email || user?.email || '',
              role: data.role || userRole || '',
            }));
          } else {
            console.log('Profile - User document does not exist');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchProfile();
  }, [user?.uid, userRole]);

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!profile.name.trim() || !profile.phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    setProfileLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profile.name.trim(),
        address: profile.address.trim(),
        phone: profile.phone.trim(),
        workSection: profile.workSection,
        email: profile.email,
        role: profile.role,
        updatedAt: new Date(),
      }, { merge: true });

      Alert.alert('Success', 'Profile updated successfully!');
      setModalVisible(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleaned.length <= 10) {
      setProfile(prev => ({ ...prev, phone: cleaned }));
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5, 10)}`;
    }
    return phone;
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
      case 'globalAdmin': return 'Global Admin';
      case 'admin': return 'Admin';
      case 'operator': return 'Operator';
      default: return role || 'Not assigned';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Large User Icon with Name */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: `rgba(${themeColors.primary === ORIENT_ELITE_PRIMARY ? '224, 168, 107' : themeColors.primary === OJAS_PRIMARY ? '141, 103, 72' : '127, 176, 105'}, 0.1)` }]}>
            <MaterialCommunityIcons 
              name="account-circle" 
              size={100} 
              color={themeColors.primary} 
            />
          </View>
          <Text style={styles.userName}>{profile.name || 'User Profile'}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Title 
            title="Profile Information" 
            titleStyle={styles.cardTitle}
            style={[styles.cardHeader, { backgroundColor: themeColors.primary }]}
            left={(props) => <MaterialCommunityIcons {...props} name="account-details" size={24} color="#fff" />}
          />
          <Card.Content style={styles.cardContent}>
            <View style={styles.profileSection}>
              <View style={[styles.profileRow, { borderLeftColor: themeColors.primary }]}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="account" size={20} color={themeColors.primary} />
                  <Text style={styles.label}>Full Name</Text>
                </View>
                <Text style={styles.value}>{profile.name || 'Not set'}</Text>
              </View>

              <View style={[styles.profileRow, { borderLeftColor: themeColors.primary }]}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="phone" size={20} color={themeColors.primary} />
                  <Text style={styles.label}>Phone</Text>
                </View>
                <Text style={styles.value}>{profile.phone ? formatPhoneNumber(profile.phone) : 'Not set'}</Text>
              </View>

              <View style={[styles.profileRow, { borderLeftColor: themeColors.primary }]}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="map-marker" size={20} color={themeColors.primary} />
                  <Text style={styles.label}>Address</Text>
                </View>
                <Text style={styles.value}>{profile.address || 'Not set'}</Text>
              </View>

              <View style={[styles.profileRow, { borderLeftColor: themeColors.primary }]}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="briefcase" size={20} color={themeColors.primary} />
                  <Text style={styles.label}>Work Section</Text>
                </View>
                <Text style={styles.value}>{getWorkSectionDisplayName(profile.workSection)}</Text>
              </View>

              <View style={[styles.profileRow, { borderLeftColor: themeColors.primary }]}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons name="shield-account" size={20} color={themeColors.primary} />
                  <Text style={styles.label}>Role</Text>
                </View>
                <Text style={styles.value}>{getRoleDisplayName(userRole || profile.role)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            style={styles.createProfileButton} 
            onPress={() => setModalVisible(true)}
            buttonColor={themeColors.primary}
            icon="account-edit"
            contentStyle={styles.buttonContent}
          >
            Create/Edit Profile
          </Button>
          
          <Button 
            mode="contained" 
            style={styles.logoutButton} 
            onPress={() => {
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Logout", 
                    onPress: async () => {
                      await logout(() => {
                        router.replace('/auth');
                      });
                    },
                    style: "destructive"
                  }
                ]
              );
            }}
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
                  style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}
                  left={(props) => <MaterialCommunityIcons {...props} name="account-edit" size={24} color="#fff" />}
                />
                <Card.Content style={styles.modalCardContent}>
                  <TextInput
                    label="Full Name *"
                    value={profile.name}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                    style={styles.modalInput}
                    mode="outlined"
                    outlineColor={themeColors.primary}
                    activeOutlineColor={themeColors.primary}
                  />
                  
                  <TextInput
                    label="Phone Number *"
                    value={profile.phone}
                    onChangeText={handlePhoneChange}
                    style={styles.modalInput}
                    mode="outlined"
                    keyboardType="phone-pad"
                    maxLength={10}
                    outlineColor={themeColors.primary}
                    activeOutlineColor={themeColors.primary}
                  />
                  
                  <TextInput
                    label="Address"
                    value={profile.address}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
                    style={styles.modalInput}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    outlineColor={themeColors.primary}
                    activeOutlineColor={themeColors.primary}
                  />
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Work Section</Text>
                    <Picker
                      selectedValue={profile.workSection}
                      onValueChange={(itemValue) => setProfile(prev => ({ ...prev, workSection: itemValue }))}
                      style={[styles.picker, { borderColor: themeColors.primary }]}
                    >
                      <Picker.Item label="Select Work Section" value="" />
                      <Picker.Item label="Hotel Orient Elite" value="orientElite" />
                      <Picker.Item label="Hotel Ojas" value="ojas" />
                      <Picker.Item label="Catena Cafe" value="catenaCafe" />
                    </Picker>
                  </View>
                </Card.Content>
                
                <View style={styles.modalButtonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setModalVisible(false)}
                    style={[styles.modalCancelButton, { borderColor: themeColors.primary }]}
                    textColor={themeColors.primary}
                    contentStyle={styles.modalButtonContent}
                  >
                    Cancel
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleSaveProfile}
                    style={styles.modalSaveButton}
                    buttonColor={themeColors.primary}
                    loading={profileLoading}
                    disabled={profileLoading}
                    contentStyle={styles.modalButtonContent}
                  >
                    Save
                  </Button>
                </View>
              </Card>
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
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
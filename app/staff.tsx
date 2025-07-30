import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export default function StaffScreen() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  console.log('Staff - Component rendered with:', { userRole, loading, usersCount: users.length });

  useEffect(() => {
    console.log('Staff - Starting to fetch users from Firebase (userRole:', userRole, ')');
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Staff - Received snapshot with', snapshot.docs.length, 'users');
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Staff - User data:', { id: doc.id, email: data.email, name: data.name, role: data.role });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || null,
        };
      }) as User[];
      
      console.log('Staff - Setting users state with', usersData.length, 'users');
      setUsers(usersData);
    }, (error) => {
      console.error('Staff - Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users: ' + error.message);
    });

    return () => unsubscribe();
  }, [userRole]);

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'This user does not have a phone number registered.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (userRole !== 'globalAdmin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.accessDeniedContent}>
          <MaterialCommunityIcons name="lock" size={80} color="#fff" />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedMessage}>
            This page is accessible only to Global Administrators.
          </Text>
          <Text style={styles.accessDeniedSubMessage}>
            Your current role: {userRole || 'No role assigned'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" style={styles.titleIcon} />
            <Text style={styles.title}>Staff Management</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                console.log('Staff - Manual refresh triggered');
                setUsers([]); // Clear users to show loading state
              }}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.dashboardContainer}>
          {/* Debug Section */}
          {/* <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>User Role: {userRole || 'No role'}</Text>
            <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Users Count: {users.length}</Text>
          </View> */}
          
          <Text style={styles.sectionTitle}>All Staff Members</Text>
          
          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No staff members found</Text>
              <Text style={styles.emptySubText}>Staff members will appear here once they register</Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {users.map((userData, index) => (
                <View key={userData.id} style={styles.userCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="account" size={24} color={PRIMARY_COLOR} />
                    <Text style={styles.userName}>{userData.name || 'No Name'}</Text>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="email" size={16} color="#666" />
                      <Text style={styles.infoText}>{userData.email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="phone" size={16} color="#666" />
                      <View style={styles.phoneContainer}>
                        <Text style={styles.infoText}>{userData.phone || 'No Phone'}</Text>
                        {userData.phone && (
                          <TouchableOpacity
                            style={styles.phoneButton}
                            onPress={() => handleCall(userData.phone!)}
                          >
                            <MaterialCommunityIcons name="phone" size={16} color={PRIMARY_COLOR} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="shield-account" size={16} color="#666" />
                      <Text style={[styles.infoText, styles.roleText]}>
                        {userData.role || 'User'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Summary Section */}
          {users.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Staff Members:</Text>
                <Text style={styles.summaryValue}>{users.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>With Phone Numbers:</Text>
                <Text style={styles.summaryValue}>
                  {users.filter(u => u.phone).length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Global Admins:</Text>
                <Text style={styles.summaryValue}>
                  {users.filter(u => u.role === 'globalAdmin').length}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedContent: {
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  accessDeniedSubMessage: {
    fontSize: 14,
    color: '#111',
    opacity: 0.8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    height: 100,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    marginRight: 10,
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dashboardContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  cardsContainer: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginLeft: 8,
  },
  cardContent: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#111',
    marginLeft: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phoneButton: {
    marginLeft: 6,
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  roleText: {
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#111',
    marginBottom: 4,
  },
}); 
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Building2, Coffee, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { BRANCHES } from '@/constants/branches';
import { Branch } from '@/types';

export default function BranchSelectorScreen() {
  const { user, logout } = useAuth();
  const { setSelectedBranch } = useBranch();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    router.replace('/(tabs)');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const renderBranch = ({ item }: { item: Branch }) => (
    <TouchableOpacity
      style={[styles.branchCard, { borderColor: item.color }]}
      onPress={() => handleBranchSelect(item)}
    >
      <View style={[styles.branchIcon, { backgroundColor: item.color + '20' }]}>
        {item.type === 'hotel' ? (
          <Building2 size={32} color={item.color} />
        ) : (
          <Coffee size={32} color={item.color} />
        )}
      </View>
      <Text style={styles.branchName}>{item.name}</Text>
      <Text style={[styles.branchType, { color: item.color }]}>
        {item.type === 'hotel' ? 'Hotel' : 'Cafe'}
      </Text>
    </TouchableOpacity>
  );

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.roleTag}>Role: {user.role}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Business</Text>
        <Text style={styles.subtitle}>Choose which business you want to manage</Text>

        <FlatList
          data={BRANCHES}
          renderItem={renderBranch}
          keyExtractor={(item) => item.id}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.branchList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  roleTag: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  branchList: {
    paddingBottom: 32,
  },
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  branchIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  branchName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  branchType: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
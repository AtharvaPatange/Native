import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { DollarSign, Plus, ArrowLeft, Building2 } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { SalesEntry } from '@/types';

export default function SalesScreen() {
  const { user } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayEntries, setTodayEntries] = useState<SalesEntry[]>([]);

  useEffect(() => {
    if (!selectedBranch) {
      router.replace('/branch-selector');
      return;
    }
    fetchTodayEntries();
  }, [selectedBranch]);

  const fetchTodayEntries = async () => {
    if (!selectedBranch) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'sales'),
        where('branchId', '==', selectedBranch.id),
        where('date', '==', today),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SalesEntry));
      
      setTodayEntries(entries);
    } catch (error) {
      console.error('Error fetching sales entries:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBranch || !user) return;

    const cash = parseFloat(cashAmount) || 0;
    const online = parseFloat(onlineAmount) || 0;
    const pending = parseFloat(pendingAmount) || 0;

    if (cash === 0 && online === 0 && pending === 0) {
      Alert.alert('Error', 'Please enter at least one amount');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const salesEntry: Omit<SalesEntry, 'id'> = {
        branchId: selectedBranch.id,
        date: today,
        cashAmount: cash,
        onlineAmount: online,
        pendingAmount: pending,
        total: cash + online + pending,
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'sales'), salesEntry);
      
      // Clear form
      setCashAmount('');
      setOnlineAmount('');
      setPendingAmount('');
      
      // Refresh entries
      fetchTodayEntries();
      
      Alert.alert('Success', 'Sales entry added successfully');
    } catch (error) {
      console.error('Error adding sales entry:', error);
      Alert.alert('Error', 'Failed to add sales entry');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBranchSelector = () => {
    setSelectedBranch(null);
    router.replace('/branch-selector');
  };

  if (!selectedBranch) return null;

  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.total, 0);
  const todayCash = todayEntries.reduce((sum, entry) => sum + entry.cashAmount, 0);
  const todayOnline = todayEntries.reduce((sum, entry) => sum + entry.onlineAmount, 0);
  const todayPending = todayEntries.reduce((sum, entry) => sum + entry.pendingAmount, 0);

  const canViewTotals = user?.role === 'globalAdmin' || user?.role === 'admin';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: selectedBranch.color }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToBranchSelector}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <DollarSign size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Sales - {selectedBranch.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Today's Sales</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cash Amount</Text>
            <TextInput
              style={styles.input}
              value={cashAmount}
              onChangeText={setCashAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Online Amount (Card/Bank Transfer)</Text>
            <TextInput
              style={styles.input}
              value={onlineAmount}
              onChangeText={setOnlineAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Pending Amount</Text>
            <TextInput
              style={styles.input}
              value={pendingAmount}
              onChangeText={setPendingAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Sales Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {canViewTotals && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Sales Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cash:</Text>
              <Text style={styles.summaryValue}>₹{todayCash.toLocaleString()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Online:</Text>
              <Text style={styles.summaryValue}>₹{todayOnline.toLocaleString()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending:</Text>
              <Text style={styles.summaryValue}>₹{todayPending.toLocaleString()}</Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{todayTotal.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {canViewTotals && todayEntries.length > 0 && (
          <View style={styles.entriesCard}>
            <Text style={styles.entriesTitle}>Today's Entries</Text>
            {todayEntries.map((entry, index) => (
              <View key={entry.id} style={styles.entryItem}>
                <Text style={styles.entryTime}>
                  Entry #{index + 1} - {new Date(entry.timestamp.toDate()).toLocaleTimeString()}
                </Text>
                <Text style={styles.entryAmount}>₹{entry.total.toLocaleString()}</Text>
                <Text style={styles.entryBy}>Added by: {entry.userEmail}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  entriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  entryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  entryTime: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  entryBy: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
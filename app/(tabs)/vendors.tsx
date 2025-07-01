import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Users, Plus, ArrowLeft, Phone, DollarSign, X } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Vendor, VendorPayment } from '@/types';

export default function VendorsScreen() {
  const { user } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vendor form
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');

  // Payment form
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentDescription, setPaymentDescription] = useState('');

  useEffect(() => {
    if (!selectedBranch) {
      router.replace('/branch-selector');
      return;
    }
    fetchData();
  }, [selectedBranch]);

  const fetchData = async () => {
    if (!selectedBranch) return;

    try {
      // Fetch vendors
      const vendorsQuery = query(
        collection(db, 'vendors'),
        where('branchId', '==', selectedBranch.id),
        orderBy('name')
      );
      const vendorsSnapshot = await getDocs(vendorsQuery);
      const vendorsData = vendorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Vendor));

      // Fetch payments
      const paymentsQuery = query(
        collection(db, 'vendorPayments'),
        where('branchId', '==', selectedBranch.id),
        orderBy('timestamp', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VendorPayment));

      setVendors(vendorsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddVendor = async () => {
    if (!selectedBranch || !user) return;

    if (!vendorName.trim() || !vendorContact.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vendorData: Omit<Vendor, 'id'> = {
        branchId: selectedBranch.id,
        name: vendorName.trim(),
        contact: vendorContact.trim(),
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'vendors'), vendorData);
      
      // Clear form and close modal
      setVendorName('');
      setVendorContact('');
      setShowAddVendor(false);
      
      // Refresh data
      fetchData();
      
      Alert.alert('Success', 'Vendor added successfully');
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedBranch || !user) return;

    if (!selectedVendor || !paymentAmount.trim()) {
      Alert.alert('Error', 'Please fill in vendor and amount');
      return;
    }

    const vendor = vendors.find(v => v.id === selectedVendor);
    if (!vendor) {
      Alert.alert('Error', 'Selected vendor not found');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const paymentData: Omit<VendorPayment, 'id'> = {
        branchId: selectedBranch.id,
        vendorId: vendor.id,
        vendorName: vendor.name,
        amount: parseFloat(paymentAmount),
        status: paymentStatus,
        date: today,
        description: paymentDescription.trim(),
        userId: user.uid,
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'vendorPayments'), paymentData);
      
      // Clear form and close modal
      setSelectedVendor('');
      setPaymentAmount('');
      setPaymentStatus('paid');
      setPaymentDescription('');
      setShowAddPayment(false);
      
      // Refresh data
      fetchData();
      
      Alert.alert('Success', 'Payment record added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment record');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBranchSelector = () => {
    setSelectedBranch(null);
    router.replace('/branch-selector');
  };

  if (!selectedBranch) return null;

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');

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
          <Users size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Vendors - {selectedBranch.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: selectedBranch.color }]}
            onPress={() => setShowAddVendor(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Vendor</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: selectedBranch.color }]}
            onPress={() => setShowAddPayment(true)}
          >
            <DollarSign size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Vendors List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Directory</Text>
          {vendors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vendors added yet</Text>
            </View>
          ) : (
            vendors.map(vendor => (
              <View key={vendor.id} style={styles.vendorCard}>
                <Text style={styles.vendorName}>{vendor.name}</Text>
                <View style={styles.vendorContact}>
                  <Phone size={16} color="#64748B" />
                  <Text style={styles.contactText}>{vendor.contact}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Paid Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Already Paid</Text>
          {paidPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No paid payments recorded</Text>
            </View>
          ) : (
            paidPayments.map(payment => (
              <View key={payment.id} style={[styles.paymentCard, styles.paidCard]}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentVendor}>{payment.vendorName}</Text>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                </View>
                <Text style={styles.paymentDate}>{payment.date}</Text>
                {payment.description && (
                  <Text style={styles.paymentDescription}>{payment.description}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Pending Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payments</Text>
          {pendingPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending payments</Text>
            </View>
          ) : (
            pendingPayments.map(payment => (
              <View key={payment.id} style={[styles.paymentCard, styles.pendingCard]}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentVendor}>{payment.vendorName}</Text>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                </View>
                <Text style={styles.paymentDate}>{payment.date}</Text>
                {payment.description && (
                  <Text style={styles.paymentDescription}>{payment.description}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Vendor Modal */}
      <Modal visible={showAddVendor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vendor</Text>
              <TouchableOpacity onPress={() => setShowAddVendor(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vendor Name *</Text>
              <TextInput
                style={styles.input}
                value={vendorName}
                onChangeText={setVendorName}
                placeholder="Enter vendor name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number *</Text>
              <TextInput
                style={styles.input}
                value={vendorContact}
                onChangeText={setVendorContact}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAddVendor}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Vendor'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal visible={showAddPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Record</Text>
              <TouchableOpacity onPress={() => setShowAddPayment(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Vendor *</Text>
              <View style={styles.selectContainer}>
                {vendors.map(vendor => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.selectOption,
                      selectedVendor === vendor.id && styles.selectOptionSelected
                    ]}
                    onPress={() => setSelectedVendor(vendor.id)}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      selectedVendor === vendor.id && styles.selectOptionTextSelected
                    ]}>
                      {vendor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    paymentStatus === 'paid' && styles.statusButtonActive
                  ]}
                  onPress={() => setPaymentStatus('paid')}
                >
                  <Text style={[
                    styles.statusButtonText,
                    paymentStatus === 'paid' && styles.statusButtonTextActive
                  ]}>
                    Paid
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    paymentStatus === 'pending' && styles.statusButtonActive
                  ]}
                  onPress={() => setPaymentStatus('pending')}
                >
                  <Text style={[
                    styles.statusButtonText,
                    paymentStatus === 'pending' && styles.statusButtonTextActive
                  ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={paymentDescription}
                onChangeText={setPaymentDescription}
                placeholder="Payment description..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAddPayment}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Payment Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  vendorContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paidCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentVendor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  paymentDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    maxHeight: 150,
  },
  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectOptionTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  statusButtonTextActive: {
    color: '#059669',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
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
  },
});
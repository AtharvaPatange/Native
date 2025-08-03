import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

interface PaymentTransaction {
  id: string;
  wherePaid: string;
  amount: number;
  date: string;
  time?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export default function AllPaymentDetailsScreen() {
  const { userRole, loading } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Check permissions first
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
        </View>
      </View>
    );
  }

  // Only fetch data if user is global admin
  useEffect(() => {
    if (userRole !== 'globalAdmin') return;

    let q = query(
      collection(db, 'paymentTransactions'),
      orderBy('createdAt', 'desc')
    );

    // Add date filtering if dates are selected
    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      q = query(
        collection(db, 'paymentTransactions'),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PaymentTransaction[];
      setTransactions(data);
      setTotal(data.reduce((sum, t) => sum + (t.amount || 0), 0));
    }, (error) => {
      console.error('Error fetching payment details:', error);
      Alert.alert('Error', 'Failed to load payment details');
    });
    
    return () => unsubscribe();
  }, [userRole, startDate, endDate]);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this transaction?\n\nWhere Paid: ${selectedTransaction.wherePaid}\nAmount: ₹${selectedTransaction.amount.toLocaleString()}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'paymentTransactions', selectedTransaction.id));
              setShowTransactionDetails(false);
              setSelectedTransaction(null);
              Alert.alert('Success', 'Transaction deleted successfully!');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction.');
            }
          },
        },
      ]
    );
  };

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
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#fff" style={styles.titleIcon} />
            <Text style={styles.title}>All Payment Details</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>₹{total}</Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.dashboardContainer}>
          {/* Date Filter Section */}
          <View style={styles.dateFilterContainer}>
            <Text style={styles.sectionTitle}>Filter by Date Range</Text>
            <View style={styles.dateButtonsContainer}>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {startDate ? startDate.toLocaleDateString() : 'Start Date'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {endDate ? endDate.toLocaleDateString() : 'End Date'}
                </Text>
              </TouchableOpacity>
              
              {(startDate || endDate) && (
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={clearDateFilters}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {(startDate || endDate) && (
              <View style={styles.filterInfo}>
                <Text style={styles.filterInfoText}>
                  Showing payments from {startDate ? startDate.toLocaleDateString() : 'all time'} 
                  to {endDate ? endDate.toLocaleDateString() : 'all time'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>All Payment Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-multiple" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubText}>
                {startDate || endDate ? 'No payments found in the selected date range' : 'Payment transactions will appear here'}
              </Text>
            </View>
          ) : (
            <View style={styles.tableContainer}>
        <DataTable>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={[styles.column, { flex: 2.5 }]}>
                    <Text style={styles.headerText}>Where Paid</Text>
                  </DataTable.Title>
                  <DataTable.Title style={[styles.column, { flex: 2.2 }]}>
                    <Text style={styles.headerText}>Amount</Text>
                  </DataTable.Title>
                  <DataTable.Title style={[styles.column, { flex: 1.8 }]}>
                    <Text style={styles.headerText}>Date</Text>
                  </DataTable.Title>
          </DataTable.Header>

                {transactions.map((transaction, index) => (
                  <DataTable.Row 
                    key={transaction.id} 
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.evenRow : styles.oddRow
                    ]}
                    onPress={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionDetails(true);
                    }}
                  >
                    <DataTable.Cell style={[styles.column, { flex: 2.5 }]}>
                      <Text style={styles.cellText} numberOfLines={1}>{transaction.wherePaid}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.column, { flex: 2.2 }]}>
                      <Text style={styles.amountText} numberOfLines={1}>₹{transaction.amount}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.column, { flex: 1.8 }]}>
                      <Text style={styles.cellText} numberOfLines={1}>{transaction.date}</Text>
                    </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      {/* Transaction Details Modal */}
      <Modal
        visible={showTransactionDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color={PRIMARY_COLOR} style={styles.modalTitleIcon} />
                <Text style={styles.modalTitle}>Transaction Details</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTransactionDetails(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedTransaction && (
              <ScrollView style={styles.detailsScrollView}>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialCommunityIcons name="map-marker" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Where Paid</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.wherePaid}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialCommunityIcons name="currency-inr" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.amountValue}>₹{selectedTransaction.amount.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {selectedTransaction.time && (
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialCommunityIcons name="clock" size={20} color={PRIMARY_COLOR} />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Time</Text>
                          <Text style={styles.detailValue}>{selectedTransaction.time}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {selectedTransaction.notes && (
                    <View style={styles.detailCard}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconContainer}>
                          <MaterialCommunityIcons name="note-text" size={20} color={PRIMARY_COLOR} />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Notes</Text>
                          <Text style={styles.detailValue}>{selectedTransaction.notes}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialCommunityIcons name="account" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Created By</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.createdBy}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color={PRIMARY_COLOR} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Created At</Text>
                        <Text style={styles.detailValue}>
                          {selectedTransaction.createdAt.toLocaleDateString()} {selectedTransaction.createdAt.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={handleDeleteTransaction}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete Transaction</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
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
  totalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 100,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dashboardContainer: {
    padding: 16,
  },
  dateFilterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  filterInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  filterInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  cellText: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    flexShrink: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    minHeight: 500,
    maxHeight: '85%',
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  closeButton: {
    padding: 8,
  },
  detailsContainer: {
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'left',
  },
  detailsScrollView: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(224, 168, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  amountValue: {
    fontSize: 22,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
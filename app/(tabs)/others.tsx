import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, DataTable, Text, TextInput } from 'react-native-paper';

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

export default function OthersScreen() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // Payment form state
  const [wherePaid, setWherePaid] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Only fetch transactions if user is global admin
  useEffect(() => {
    if (userRole !== 'globalAdmin') return;

    const q = query(
      collection(db, 'paymentTransactions'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PaymentTransaction[];
      
      setTransactions(transactionsData);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    });

    return () => unsubscribe();
  }, [userRole]);

  const handleAddPayment = async () => {
    if (!wherePaid.trim() || !amount.trim() || !date) {
      Alert.alert('Error', 'Please fill in all required fields (Where Paid, Amount, and Date)');
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const paymentData = {
        wherePaid: wherePaid.trim(),
        amount: amountValue,
        date: date.toLocaleDateString(),
        time: time.trim() || null,
        notes: notes.trim() || null,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      };

      await addDoc(collection(db, 'paymentTransactions'), paymentData);
      
      // Reset form
      setWherePaid('');
      setAmount('');
      setDate(new Date());
      setTime('');
      setNotes('');
      setModalVisible(false);
      
      Alert.alert('Success', 'Payment transaction added successfully!');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment transaction.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
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
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#fff" style={styles.titleIcon} />
            <Text style={styles.title}>Payment Tracking</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
          
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>Recent Payment Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-multiple" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>Add your first payment transaction using the + button</Text>
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
              
              {/* Total Section */}
              <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>
                    ₹{transactions.reduce((sum, transaction) => sum + transaction.amount, 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Transaction</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Where Paid *</Text>
              <TextInput 
                placeholder="Enter where the payment was made" 
                value={wherePaid} 
                onChangeText={setWherePaid} 
                style={styles.input} 
                mode="outlined"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  {date.toLocaleDateString()}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

              <Text style={styles.inputLabel}>Time (Optional)</Text>
              <TextInput 
                placeholder="Enter time (e.g., HH:MM AM/PM)" 
                value={time} 
                onChangeText={setTime} 
                style={styles.input} 
                mode="outlined"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Amount Paid *</Text>
              <TextInput 
                placeholder="Enter amount" 
                value={amount} 
                onChangeText={setAmount} 
                keyboardType="numeric"
                style={styles.input} 
                mode="outlined"
                returnKeyType="next"
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput 
                placeholder="Add any additional notes" 
                value={notes} 
                onChangeText={setNotes} 
                multiline
                numberOfLines={3}
                style={styles.input} 
                mode="outlined"
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <Button 
                mode="contained" 
                onPress={handleAddPayment}
                style={styles.saveButton}
                buttonColor={PRIMARY_COLOR}
              >
                Save Transaction
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

      {/* Action Buttons */}
      {userRole === 'globalAdmin' && (
        <View style={styles.actionButtonsContainer}>
          <Button
            mode="contained"
            buttonColor={PRIMARY_COLOR}
            onPress={() => router.push('/all-payment-details')}
            style={[styles.actionButton, { marginBottom: 12 }]}
            icon="table"
          >
            All Payment Details
          </Button>
          
          <Button
            mode="contained"
            buttonColor={SECONDARY_COLOR}
            onPress={() => router.push('/staff')}
            style={styles.actionButton}
            icon="account-group"
          >
            Staff
          </Button>
        </View>
      )}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  addButtonText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111',
    paddingBottom: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 32,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    minHeight: 600,
    maxHeight: '95%',
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
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#111',
  },
  saveButton: {
    marginTop: 32,
    borderRadius: 12,
    paddingVertical: 12,
  },
  totalContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  actionButtonsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  actionButton: {
    borderRadius: 8,
  },
  detailsScrollView: {
    flex: 1,
  },
  detailsContainer: {
    paddingVertical: 8,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 18,
    color: '#111',
    fontWeight: '500',
    textAlign: 'left',
  },
  amountValue: {
    fontSize: 22,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
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
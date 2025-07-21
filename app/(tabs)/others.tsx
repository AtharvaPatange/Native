import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
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
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  
  // Payment form state
  const [wherePaid, setWherePaid] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch transactions (move above conditional return)
  useEffect(() => {
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
    });

    return () => unsubscribe();
  }, []);

  // Check if user is global admin (after all hooks)
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

  const handleAddPayment = async () => {
    if (!wherePaid.trim() || !amount.trim() || !date) {
      Alert.alert('Error', 'Please fill in all required fields (Where Paid, Amount, and Date)');
      return;
    }

    try {
      const paymentData = {
        wherePaid: wherePaid.trim(),
        amount: Number(amount),
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.title}>Others - Payment Tracking</Text>
        <TouchableOpacity
          style={styles.iconButtonWrapper}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={36}
            color="#fff"
            style={styles.iconButton}
          />
        </TouchableOpacity>
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
            <DataTable>
              <DataTable.Header>
                <DataTable.Title><Text style={{ color: '#111', fontWeight: 'bold' }}>Where Paid</Text></DataTable.Title>
                <DataTable.Title numeric><Text style={{ color: '#111', fontWeight: 'bold' }}>Amount</Text></DataTable.Title>
                <DataTable.Title style={{ width: 32 }}> </DataTable.Title>
                <DataTable.Title><Text style={{ color: '#111', fontWeight: 'bold' }}>Date</Text></DataTable.Title>
              </DataTable.Header>

              {transactions.map((transaction) => (
                <DataTable.Row key={transaction.id}>
                  <DataTable.Cell><Text style={{ color: '#111' }}>{transaction.wherePaid}</Text></DataTable.Cell>
                  <DataTable.Cell numeric><Text style={{ color: '#111' }}>₹{transaction.amount}</Text></DataTable.Cell>
                  {/* Spacer between Amount and Date */}
                  <View style={{ width: 32 }} />
                  <DataTable.Cell><Text style={{ color: '#111' }}>{transaction.date}</Text></DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
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
          <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.modalContent}>
              <MaterialCommunityIcons 
                name="close" 
                size={28} 
                color="#222" 
                style={styles.closeIcon} 
                onPress={() => setModalVisible(false)} 
              />
              <Text style={styles.modalTitle}>Add Payment Transaction</Text>
              
              <Text style={styles.inputLabel}>Where Paid *</Text>
              <TextInput 
                placeholder="Enter where the payment was made" 
                value={wherePaid} 
                onChangeText={setWherePaid} 
                style={styles.input} 
                mode="outlined"
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
              />

              <Text style={styles.inputLabel}>Amount Paid *</Text>
              <TextInput 
                placeholder="Enter amount" 
                value={amount} 
                onChangeText={setAmount} 
                keyboardType="numeric"
                style={styles.input} 
                mode="outlined"
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
              />

              <Button 
                mode="contained" 
                onPress={handleAddPayment}
                style={styles.saveButton}
                buttonColor={PRIMARY_COLOR}
              >
                Save Transaction
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* All Payment Details Button */}
      {userRole === 'globalAdmin' && (
        <View style={{ padding: 16, backgroundColor: '#fff' }}>
          <Button
            mode="contained"
            buttonColor={PRIMARY_COLOR}
            onPress={() => router.push('/all-payment-details')}
            style={{ borderRadius: 8 }}
            icon="table"
          >
            All Payment Details
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
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
  },
  iconButtonWrapper: {
    padding: 4,
  },
  iconButton: {
    marginLeft: 8,
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
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    minHeight: 400,
  },
  closeIcon: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#111',
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 8,
  },
}); 
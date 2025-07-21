import { useAuth } from '@/components/AuthContext';
import HotelDashboard from '@/components/HotelDashboard';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Text, TextInput } from 'react-native-paper';

export default function CatenaCafeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  // Sale form
  const [saleCash, setSaleCash] = useState('');
  const [saleType, setSaleType] = useState('online');
  const [saleStatus, setSaleStatus] = useState('pending');
  // Expense form
  const [expenseCash, setExpenseCash] = useState('');
  const [expenseType, setExpenseType] = useState('online');
  const [expenseStatus, setExpenseStatus] = useState('pending');
  // Vendor form
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  // Maintenance form
  const [maintDesc, setMaintDesc] = useState('');
  const [maintRoom, setMaintRoom] = useState('');
  // Add missing maintenance fields
  const [maintVendorName, setMaintVendorName] = useState('');
  const [maintVendorPhone, setMaintVendorPhone] = useState('');
  const [maintPaymentMode, setMaintPaymentMode] = useState('cash');
  const [maintStatus, setMaintStatus] = useState('pending');
  // Food Bill form
  const [foodBillAmount, setFoodBillAmount] = useState('');
  const [foodBillPaymentMode, setFoodBillPaymentMode] = useState('cash');
  const [foodBillStatus, setFoodBillStatus] = useState('pending');
  // Payment form
  const [payVendor, setPayVendor] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState('pending');

  // Raw materials purchasing state
  const [rawDate, setRawDate] = useState<Date | null>(null);
  const [showRawDatePicker, setShowRawDatePicker] = useState(false);
  const [rawItems, setRawItems] = useState([{ name: '', amount: '' }]);

  // Handlers for Catena Cafe-specific collections
  const handleAddSale = async () => {
    try {
      await addDoc(collection(db, 'catenacafesale'), {
        cash: Number(saleCash),
        type: saleType,
        status: saleStatus,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setSaleCash('');
      setSaleType('online');
      setSaleStatus('pending');
      Alert.alert('Success', 'Sale entry added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add sale entry.');
    }
  };
  const handleAddExpense = async () => {
    try {
      await addDoc(collection(db, 'catenacafeexpense'), {
        cash: Number(expenseCash),
        type: expenseType,
        status: expenseStatus,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setExpenseCash('');
      setExpenseType('online');
      setExpenseStatus('pending');
      Alert.alert('Success', 'Expense entry added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense entry.');
    }
  };
  const handleAddVendor = async () => {
    try {
      await addDoc(collection(db, 'catenacafevendors'), {
        name: vendorName,
        contact: vendorContact,
        createdBy: user?.email || 'guest',
      });
      setVendorName('');
      setVendorContact('');
      Alert.alert('Success', 'Vendor added!');
    } catch {
      Alert.alert('Error', 'Failed to add vendor.');
    }
  };
  const handleAddMaintenance = async () => {
    try {
      await addDoc(collection(db, 'catenacafemaintenance'), {
        desc: maintDesc,
        room: maintRoom,
        vendorName: maintVendorName,
        vendorPhone: maintVendorPhone,
        paymentMode: maintPaymentMode,
        status: maintStatus,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setMaintDesc('');
      setMaintRoom('');
      setMaintVendorName('');
      setMaintVendorPhone('');
      setMaintPaymentMode('cash');
      setMaintStatus('pending');
      Alert.alert('Success', 'Maintenance log added!');
    } catch {
      Alert.alert('Error', 'Failed to add maintenance log.');
    }
  };
  const handleAddFoodBill = async () => {
    try {
      await addDoc(collection(db, 'catenacafefoodbills'), {
        amount: Number(foodBillAmount),
        paymentMode: foodBillPaymentMode,
        status: foodBillStatus,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setFoodBillAmount('');
      setFoodBillPaymentMode('cash');
      setFoodBillStatus('pending');
      Alert.alert('Success', 'Food bill entry added!');
    } catch {
      Alert.alert('Error', 'Failed to add food bill entry.');
    }
  };
  const handleAddPayment = async () => {
    try {
      await addDoc(collection(db, 'catenacafevendorpayments'), {
        vendor: payVendor,
        amount: Number(payAmount),
        status: payStatus,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setPayVendor('');
      setPayAmount('');
      setPayStatus('pending');
      Alert.alert('Success', 'Vendor payment added!');
    } catch {
      Alert.alert('Error', 'Failed to add vendor payment.');
    }
  };

  const handleAddRawItem = () => setRawItems([...rawItems, { name: '', amount: '' }]);
  const handleRawItemChange = (idx: number, field: 'name' | 'amount', value: string) => {
    setRawItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleSaveRawPurchases = async () => {
    if (!rawDate || rawItems.some(item => !item.name || !item.amount)) {
      Alert.alert('Error', 'Please select a date and fill all item fields');
      return;
    }
    await addDoc(collection(db, 'catenaRawPurchases'), {
      date: rawDate.toISOString().split('T')[0],
      items: rawItems.map(item => ({ name: item.name, amount: Number(item.amount) })),
      createdAt: new Date(),
      createdBy: user?.email || 'guest',
    });
    setRawDate(null);
    setRawItems([{ name: '', amount: '' }]);
    Alert.alert('Success', 'Raw material purchases added!');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Catena Cafe</Text>
        <View style={styles.iconButtonWrapper}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={36}
            color="#111"
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>
      <HotelDashboard branchId="catenaCafe" branchName="Catena Cafe" />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Entries</Text>
            {/* 1. Today&apos;s Total Sale */}
            <Text style={styles.sectionTitle}>Today&apos;s Total Sale</Text>
            <TextInput placeholder="Cash" value={saleCash} onChangeText={setSaleCash} keyboardType="numeric" style={styles.input} />
            <Picker
              selectedValue={saleType}
              onValueChange={setSaleType}
              style={styles.picker}
            >
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Card" value="card" />
              <Picker.Item label="Bank Transfer" value="bank" />
            </Picker>
            <Picker
              selectedValue={saleStatus}
              onValueChange={setSaleStatus}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Done" value="done" />
            </Picker>
            <Button mode="contained" onPress={handleAddSale} style={styles.saveBtn}>Save Sale</Button>
            {/* 2. Today&apos;s Total Expense */}
            <Text style={styles.sectionTitle}>Today&apos;s Total Expense</Text>
            <TextInput placeholder="Cash" value={expenseCash} onChangeText={setExpenseCash} keyboardType="numeric" style={styles.input} />
            <Picker
              selectedValue={expenseType}
              onValueChange={setExpenseType}
              style={styles.picker}
            >
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Card" value="card" />
              <Picker.Item label="Bank Transfer" value="bank" />
            </Picker>
            <Picker
              selectedValue={expenseStatus}
              onValueChange={setExpenseStatus}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Done" value="done" />
            </Picker>
            <Button mode="contained" onPress={handleAddExpense} style={styles.saveBtn}>Save Expense</Button>
            {/* 3. Vendor List */}
            <Text style={styles.sectionTitle}>Vendor List</Text>
            <TextInput placeholder="Vendor Name" value={vendorName} onChangeText={setVendorName} style={styles.input} />
            <TextInput placeholder="Contact Number" value={vendorContact} onChangeText={setVendorContact} keyboardType="phone-pad" style={styles.input} />
            <Button mode="contained" onPress={handleAddVendor} style={styles.saveBtn}>Save Vendor</Button>
            {/* 4. Maintenance */}
            <Text style={styles.sectionTitle}>Maintenance</Text>
            <TextInput placeholder="Description" value={maintDesc} onChangeText={setMaintDesc} style={styles.input} />
            <TextInput placeholder="Room Number" value={maintRoom} onChangeText={setMaintRoom} style={styles.input} />
            <TextInput placeholder="Vendor Name" value={maintVendorName} onChangeText={setMaintVendorName} style={styles.input} />
            <TextInput placeholder="Phone Number" value={maintVendorPhone} onChangeText={setMaintVendorPhone} keyboardType="phone-pad" style={styles.input} />
            <Picker
              selectedValue={maintPaymentMode}
              onValueChange={setMaintPaymentMode}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Card" value="card" />
            </Picker>
            <Picker
              selectedValue={maintStatus}
              onValueChange={setMaintStatus}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Done" value="done" />
            </Picker>
            <Button mode="contained" onPress={handleAddMaintenance} style={styles.saveBtn}>Save Maintenance</Button>
            {/* 6. Food Bill */}
            <Text style={styles.sectionTitle}>Food Bill</Text>
            <TextInput
              placeholder="Amount"
              value={foodBillAmount}
              onChangeText={setFoodBillAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <Picker
              selectedValue={foodBillPaymentMode}
              onValueChange={setFoodBillPaymentMode}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Card" value="card" />
            </Picker>
            <Picker
              selectedValue={foodBillStatus}
              onValueChange={setFoodBillStatus}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Done" value="done" />
            </Picker>
            <Button mode="contained" onPress={handleAddFoodBill} style={styles.saveBtn}>Save Food Bill</Button>
            {/* 5. Vendor Payment */}
            <Text style={styles.sectionTitle}>Vendor Payment</Text>
            <TextInput placeholder="Vendor Name" value={payVendor} onChangeText={setPayVendor} style={styles.input} />
            <TextInput placeholder="Amount" value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" style={styles.input} />
            <Picker
              selectedValue={payStatus}
              onValueChange={setPayStatus}
              style={styles.picker}
            >
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Done" value="done" />
            </Picker>
            <Button mode="contained" onPress={handleAddPayment} style={styles.saveBtn}>Save Payment</Button>
            {/* 6. Daily Purchasing of Raw Materials */}
            <Text style={styles.sectionTitle}>Daily Purchasing of Raw Materials</Text>
            <TouchableOpacity onPress={() => setShowRawDatePicker(true)} style={styles.input}>
              <TextInput
                placeholder="Select Date"
                value={rawDate ? rawDate.toISOString().split('T')[0] : ''}
                editable={false}
                pointerEvents="none"
                style={{ backgroundColor: '#f9f9f9' }}
              />
            </TouchableOpacity>
            {showRawDatePicker && (
              <DateTimePicker
                value={rawDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowRawDatePicker(false);
                  if (date) setRawDate(date);
                }}
              />
            )}
            {rawItems.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  placeholder="Item Name"
                  value={item.name}
                  onChangeText={v => handleRawItemChange(idx, 'name', v)}
                  style={[styles.input, { flex: 2, marginRight: 8 }]}
                />
                <TextInput
                  placeholder="Amount"
                  value={item.amount}
                  onChangeText={v => handleRawItemChange(idx, 'amount', v)}
                  keyboardType="numeric"
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
            ))}
            <Button mode="outlined" onPress={handleAddRawItem} style={{ marginBottom: 8 }}>Add Item</Button>
            <Button mode="contained" onPress={handleSaveRawPurchases} style={styles.saveBtn}>Save Raw Purchases</Button>
            <Appbar.Action icon="close" onPress={() => setModalVisible(false)} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
} 

const PRIMARY_GREEN = '#A8E6A3';
const SECONDARY_GREEN = '#E8FCEB';
const styles = StyleSheet.create({
  appbar: {
    backgroundColor: PRIMARY_GREEN,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    position: 'relative',
    justifyContent: 'center',
  },
  title: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 22,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    paddingTop: 22,
    zIndex: 1,
  },
  iconButtonWrapper: {
    position: 'absolute',
    right: 16,
    top: 40,
    zIndex: 2,
  },
  iconButton: {},
  modalScroll: {
    flex: 1,
    backgroundColor: SECONDARY_GREEN,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'stretch',
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    width: '100%',
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#111',
  },
  picker: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 6,
  },
  saveBtn: {
    marginBottom: 16,
    backgroundColor: PRIMARY_GREEN,
    color: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: SECONDARY_GREEN,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 18,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: PRIMARY_GREEN,
    color: '#111',
    borderRadius: 8,
    marginTop: 8,
  },
}); 
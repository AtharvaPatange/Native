import { useAuth } from '@/components/AuthContext';
import HotelDashboard from '@/components/HotelDashboard';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

// Ojas Veg Restaurant Theme Colors
const OJAS_COLORS = {
  primary: '#8B4513', // Reddish-brown (like the OJAS text)
  secondary: '#228B22', // Green (like VEG)
  accent: '#DC143C', // Red (like RESTAURANT)
  highlight: '#FF8C00', // Orange (like the flower)
  background: '#FFFFFF', // White
  surface: '#F8F9FA', // Light gray for cards
  text: '#2C2C2C', // Dark text
  textLight: '#666666', // Light text
  border: '#E0E0E0', // Light border
};

export default function HotelOjasScreen() {
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

  // Handlers for Ojas-specific collections
  const handleAddSale = async () => {
    try {
      await addDoc(collection(db, 'ojassale'), {
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
      await addDoc(collection(db, 'ojasexpense'), {
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
      await addDoc(collection(db, 'ojasvendors'), {
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
      await addDoc(collection(db, 'ojasmaintenance'), {
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
      await addDoc(collection(db, 'ojasfoodbills'), {
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
      await addDoc(collection(db, 'ojasvendorpayments'), {
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
    await addDoc(collection(db, 'ojasRawPurchases'), {
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
    <View style={{ flex: 1, backgroundColor: OJAS_COLORS.background }}>
      <View style={styles.appbar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGraphic}>
            <View style={styles.flowerIcon}>
              <MaterialCommunityIcons name="flower" size={24} color={OJAS_COLORS.highlight} />
            </View>
          </View>
          <Text style={styles.title}>OJAS</Text>
          <Text style={styles.subtitle}>VEG RESTAURANT</Text>
          <Text style={styles.address}>1st Floor, Hotel Orient Elite</Text>
        </View>
        <View style={styles.iconButtonWrapper}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={36}
            color={OJAS_COLORS.accent}
            style={styles.iconButton}
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>
      <HotelDashboard branchId="ojas" branchName="Hotel Ojas" />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Entries</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color={OJAS_COLORS.text} />
              </TouchableOpacity>
            </View>
            {/* 1. Today&apos;s Total Sale */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today&apos;s Total Sale</Text>
              <TextInput 
                placeholder="Cash" 
                value={saleCash} 
                onChangeText={setSaleCash} 
                keyboardType="numeric" 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
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
              <Button 
                mode="contained" 
                onPress={handleAddSale} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Sale
              </Button>
            </View>

            {/* 2. Today&apos;s Total Expense */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today&apos;s Total Expense</Text>
              <TextInput 
                placeholder="Cash" 
                value={expenseCash} 
                onChangeText={setExpenseCash} 
                keyboardType="numeric" 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
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
              <Button 
                mode="contained" 
                onPress={handleAddExpense} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Expense
              </Button>
            </View>

            {/* 3. Vendor List */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Vendor List</Text>
              <TextInput 
                placeholder="Vendor Name" 
                value={vendorName} 
                onChangeText={setVendorName} 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <TextInput 
                placeholder="Contact Number" 
                value={vendorContact} 
                onChangeText={setVendorContact} 
                keyboardType="phone-pad" 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <Button 
                mode="contained" 
                onPress={handleAddVendor} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Vendor
              </Button>
            </View>

            {/* 4. Maintenance */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Maintenance</Text>
              <TextInput 
                placeholder="Description" 
                value={maintDesc} 
                onChangeText={setMaintDesc} 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <TextInput 
                placeholder="Room Number" 
                value={maintRoom} 
                onChangeText={setMaintRoom} 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <TextInput 
                placeholder="Vendor Name" 
                value={maintVendorName} 
                onChangeText={setMaintVendorName} 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <TextInput 
                placeholder="Phone Number" 
                value={maintVendorPhone} 
                onChangeText={setMaintVendorPhone} 
                keyboardType="phone-pad" 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
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
              <Button 
                mode="contained" 
                onPress={handleAddMaintenance} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Maintenance
              </Button>
            </View>

            {/* 5. Food Bill */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Food Bill</Text>
              <TextInput
                placeholder="Amount"
                value={foodBillAmount}
                onChangeText={setFoodBillAmount}
                keyboardType="numeric"
                style={styles.input}
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
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
              <Button 
                mode="contained" 
                onPress={handleAddFoodBill} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Food Bill
              </Button>
            </View>

            {/* 6. Vendor Payment */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Vendor Payment</Text>
              <TextInput 
                placeholder="Vendor Name" 
                value={payVendor} 
                onChangeText={setPayVendor} 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <TextInput 
                placeholder="Amount" 
                value={payAmount} 
                onChangeText={setPayAmount} 
                keyboardType="numeric" 
                style={styles.input} 
                theme={{ colors: { primary: OJAS_COLORS.primary } }}
              />
              <Picker
                selectedValue={payStatus}
                onValueChange={setPayStatus}
                style={styles.picker}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Done" value="done" />
              </Picker>
              <Button 
                mode="contained" 
                onPress={handleAddPayment} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Payment
              </Button>
            </View>

            {/* 7. Daily Purchasing of Raw Materials */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Daily Purchasing of Raw Materials</Text>
              <TouchableOpacity onPress={() => setShowRawDatePicker(true)} style={styles.dateInput}>
                <TextInput
                  placeholder="Select Date"
                  value={rawDate ? rawDate.toISOString().split('T')[0] : ''}
                  editable={false}
                  pointerEvents="none"
                  style={styles.input}
                  theme={{ colors: { primary: OJAS_COLORS.primary } }}
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
                <View key={idx} style={styles.rawItemRow}>
                  <TextInput
                    placeholder="Item Name"
                    value={item.name}
                    onChangeText={v => handleRawItemChange(idx, 'name', v)}
                    style={[styles.input, styles.itemNameInput]}
                    theme={{ colors: { primary: OJAS_COLORS.primary } }}
                  />
                  <TextInput
                    placeholder="Amount"
                    value={item.amount}
                    onChangeText={v => handleRawItemChange(idx, 'amount', v)}
                    keyboardType="numeric"
                    style={[styles.input, styles.itemAmountInput]}
                    theme={{ colors: { primary: OJAS_COLORS.primary } }}
                  />
                </View>
              ))}
              <Button 
                mode="outlined" 
                onPress={handleAddRawItem} 
                style={styles.addItemBtn}
                textColor={OJAS_COLORS.primary}
                buttonColor={OJAS_COLORS.background}
              >
                Add Item
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveRawPurchases} 
                style={styles.saveBtn}
                buttonColor={OJAS_COLORS.primary}
                textColor={OJAS_COLORS.background}
              >
                Save Raw Purchases
              </Button>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
} 

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: OJAS_COLORS.primary,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flowerIcon: {
    backgroundColor: OJAS_COLORS.background,
    borderRadius: 20,
    padding: 4,
    marginRight: 8,
  },
  title: {
    color: OJAS_COLORS.background,
    fontWeight: 'bold',
    fontSize: 28,
    fontFamily: 'serif',
    letterSpacing: 2,
  },
  subtitle: {
    color: OJAS_COLORS.background,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  address: {
    color: OJAS_COLORS.background,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },
  iconButtonWrapper: {
    position: 'absolute',
    right: 16,
    top: 60,
    zIndex: 2,
  },
  iconButton: {},
  modalScroll: {
    flex: 1,
    backgroundColor: OJAS_COLORS.surface,
  },
  modalContent: {
    backgroundColor: OJAS_COLORS.background,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'stretch',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: OJAS_COLORS.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: OJAS_COLORS.primary,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: OJAS_COLORS.surface,
  },
  sectionCard: {
    backgroundColor: OJAS_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: OJAS_COLORS.secondary,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: OJAS_COLORS.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: OJAS_COLORS.border,
    width: '100%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: OJAS_COLORS.background,
    fontSize: 16,
  },
  picker: {
    backgroundColor: OJAS_COLORS.background,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: OJAS_COLORS.border,
  },
  saveBtn: {
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  dateInput: {
    marginBottom: 12,
  },
  rawItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  itemNameInput: {
    flex: 2,
  },
  itemAmountInput: {
    flex: 1,
  },
  addItemBtn: {
    marginBottom: 12,
    borderRadius: 8,
    borderColor: OJAS_COLORS.primary,
  },
}); 
import { useAuth } from '@/components/AuthContext';
import HotelDashboard from '@/components/HotelDashboard';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
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
  // Payment form
  const [payVendor, setPayVendor] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState('pending');

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
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setMaintDesc('');
      setMaintRoom('');
      Alert.alert('Success', 'Maintenance log added!');
    } catch {
      Alert.alert('Error', 'Failed to add maintenance log.');
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Catena Cafe</Text>
        <View style={styles.iconButtonWrapper}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={36}
            color="#1976d2"
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
            <Button mode="contained" onPress={handleAddMaintenance} style={styles.saveBtn}>Save Maintenance</Button>
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
            <Appbar.Action icon="close" onPress={() => setModalVisible(false)} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
} 

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: '#63b3ed', // sky blue
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    position: 'relative',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
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
    backgroundColor: '#f5f6fa',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderRadius: 6,
  },
  saveBtn: {
    marginBottom: 16,
    backgroundColor: '#1976d2',
  },
}); 
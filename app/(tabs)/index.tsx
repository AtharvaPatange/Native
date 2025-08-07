import { useAuth } from '@/components/AuthContext';
import HotelDashboard from '@/components/HotelDashboard';
import { db } from '@/constants/firebaseConfig';
import { useUserStore } from '../zustand';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

export default function HotelOrientEliteScreen() {
  const { user, loading, userRole } = useAuth();
  const workSection = useUserStore((state) => state.workSection);
  if (userRole !== 'globalAdmin' && workSection !== 'orientElite') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <MaterialCommunityIcons name="lock" size={80} color="#ccc" />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111', marginTop: 16 }}>Access Restricted</Text>
        <Text style={{ color: '#111', marginTop: 8 }}>You do not have permission to view this section.</Text>
      </View>
    );
  }
  const [modalVisible, setModalVisible] = useState(false);
  
  // Fetch vendors for dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsQuery = query(collection(db, 'vendors'), where('branchId', '==', 'orientElite'));
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendorsData = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorsData);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);
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
  const [maintVendorName, setMaintVendorName] = useState('');
  const [maintVendorPhone, setMaintVendorPhone] = useState('');
  const [maintPaymentMode, setMaintPaymentMode] = useState('cash');
  const [maintStatus, setMaintStatus] = useState('pending');
  // Payment form
  const [payVendor, setPayVendor] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payPaymentMode, setPayPaymentMode] = useState('cash');
  const [payStatus, setPayStatus] = useState('pending');
  const [payStartDate, setPayStartDate] = useState(new Date());
  const [payEndDate, setPayEndDate] = useState(new Date());
  const [showPayStartPicker, setShowPayStartPicker] = useState(false);
  const [showPayEndPicker, setShowPayEndPicker] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchText, setVendorSearchText] = useState('');
  // Food Bill form
  const [foodBillAmount, setFoodBillAmount] = useState('');
  const [foodBillPaymentMode, setFoodBillPaymentMode] = useState('cash');
  const [foodBillStatus, setFoodBillStatus] = useState('pending');
  const branchId = 'orientElite';

  // Handlers
  const handleAddSale = async () => {
    try {
      await addDoc(collection(db, 'sales'), {
        cash: Number(saleCash),
        type: saleType,
        status: saleStatus,
        branchId,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setSaleCash('');
      setSaleType('online');
      setSaleStatus('pending');
      Alert.alert('Success', 'Sale entry added!');
    } catch (e) {
      console.log('Error adding sale:', e, user);
      Alert.alert('Error', 'Failed to add sale entry.');
    }
  };
  const handleAddExpense = async () => {
    try {
      await addDoc(collection(db, 'expenses'), {
        cash: Number(expenseCash),
        type: expenseType,
        status: expenseStatus,
        branchId,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setExpenseCash('');
      setExpenseType('online');
      setExpenseStatus('pending');
      Alert.alert('Success', 'Expense entry added!');
    } catch (e) {
      console.log('Error adding expense:', e, user);
      Alert.alert('Error', 'Failed to add expense entry.');
    }
  };
  const handleAddVendor = async () => {
    try {
      await addDoc(collection(db, 'vendors'), {
        name: vendorName,
        contact: vendorContact,
        branchId,
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
      await addDoc(collection(db, 'maintenanceLogs'), {
        desc: maintDesc,
        room: maintRoom,
        vendorName: maintVendorName,
        vendorPhone: maintVendorPhone,
        paymentMode: maintPaymentMode,
        status: maintStatus,
        branchId,
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
  const handleAddPayment = async () => {
    if (!payVendor || !payAmount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'vendorPayments'), {
        vendor: payVendor,
        amount: Number(payAmount),
        paymentMode: payPaymentMode,
        status: payStatus,
        startDate: payStartDate,
        endDate: payEndDate,
        branchId: 'orientElite',
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setPayVendor('');
      setPayAmount('');
      setPayPaymentMode('cash');
      setPayStatus('pending');
      setPayStartDate(new Date());
      setPayEndDate(new Date());
      Alert.alert('Success', 'Vendor payment added!');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add vendor payment.');
    }
  };
  const handleAddFoodBill = async () => {
    try {
      await addDoc(collection(db, 'foodBills'), {
        amount: Number(foodBillAmount),
        paymentMode: foodBillPaymentMode,
        status: foodBillStatus,
        branchId,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setFoodBillAmount('');
      setFoodBillPaymentMode('cash');
      setFoodBillStatus('pending');
      Alert.alert('Success', 'Food bill entry added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add food bill entry.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.appbar, { backgroundColor: undefined }]}>
        <LinearGradient
          colors={['#e0a86b', '#e2af7a']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={[styles.title, { color: '#111' }]}>Hotel Orient Elite</Text>
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
      <HotelDashboard branchId="orientElite" branchName="Hotel Orient Elite" />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.modalContentNew}>
              <MaterialCommunityIcons name="close" size={28} color="#222" style={styles.closeIcon} onPress={() => setModalVisible(false)} />
              <Text style={styles.modalTitleNew}>Add Entries</Text>
              {/* 1. Today's Total Sale */}
              <Text style={styles.sectionTitleNew}>Today&apos;s Total Sale</Text>
              <TextInput placeholder="Amount" value={saleCash} onChangeText={setSaleCash} keyboardType="numeric" style={styles.inputNew} placeholderTextColor="#888" />
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={saleType}
                  onValueChange={setSaleType}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="Bank Transfer" value="bank" />
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={saleStatus}
                  onValueChange={setSaleStatus}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
              <Button mode="contained" onPress={handleAddSale} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Sale</Button>
              {/* 2. Today's Total Expense */}
              <Text style={styles.sectionTitleNew}>Today&apos;s Total Expense</Text>
              <TextInput placeholder="Amount" value={expenseCash} onChangeText={setExpenseCash} keyboardType="numeric" style={styles.inputNew} placeholderTextColor="#888" />
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={expenseType}
                  onValueChange={setExpenseType}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Card" value="card" />
                  <Picker.Item label="Bank Transfer" value="bank" />
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={expenseStatus}
                  onValueChange={setExpenseStatus}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
              <Button mode="contained" onPress={handleAddExpense} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Expense</Button>
              {/* 3. Vendor List */}
              <Text style={styles.sectionTitleNew}>Vendor List</Text>
              <TextInput placeholder="Vendor Name" value={vendorName} onChangeText={setVendorName} style={styles.inputNew} placeholderTextColor="#888" />
              <TextInput placeholder="Contact Number" value={vendorContact} onChangeText={setVendorContact} keyboardType="phone-pad" style={styles.inputNew} placeholderTextColor="#888" />
              <Button mode="contained" onPress={handleAddVendor} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Vendor</Button>
              {vendors.map((vendor) => (
                <View key={vendor.id} style={styles.vendorRow}>
                  <Text style={styles.vendorNameText}>{vendor.name}</Text>
                  <Text style={styles.vendorContactText}>{vendor.contact}</Text>
                  <Button mode="outlined" onPress={async () => { if (vendor.id) { await deleteDoc(doc(db, 'vendors', vendor.id)); setVendors(vendors.filter(v => v.id !== vendor.id)); } }}>Delete</Button>
                </View>
              ))}
              {/* 4. Maintenance */}
              <Text style={styles.sectionTitleNew}>Maintenance</Text>
              <TextInput placeholder="Description" value={maintDesc} onChangeText={setMaintDesc} style={styles.inputNew} placeholderTextColor="#888" />
              <TextInput placeholder="Room Number" value={maintRoom} onChangeText={setMaintRoom} style={styles.inputNew} placeholderTextColor="#888" />
              <TextInput placeholder="Vendor Name" value={maintVendorName} onChangeText={setMaintVendorName} style={styles.inputNew} placeholderTextColor="#888" />
              <TextInput placeholder="Phone Number" value={maintVendorPhone} onChangeText={setMaintVendorPhone} keyboardType="phone-pad" style={styles.inputNew} placeholderTextColor="#888" />
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={maintPaymentMode}
                  onValueChange={setMaintPaymentMode}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Card" value="card" />
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={maintStatus}
                  onValueChange={setMaintStatus}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
              <Button mode="contained" onPress={handleAddMaintenance} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Maintenance</Button>
              {/* 5. Vendor Payment */}
              <Text style={styles.sectionTitleNew}>Vendor Payment</Text>
              
              {/* Vendor Name Dropdown */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdownButton} 
                  onPress={() => setShowVendorDropdown(!showVendorDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, { color: payVendor ? '#222' : '#888' }]}>
                    {payVendor || 'Select Vendor'}
                  </Text>
                  <MaterialCommunityIcons 
                    name={showVendorDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#888" 
                  />
                </TouchableOpacity>
                {showVendorDropdown && (
                  <View style={styles.dropdownList}>
                    <TextInput
                      placeholder="Search vendors..."
                      value={vendorSearchText}
                      onChangeText={setVendorSearchText}
                      style={styles.searchInput}
                      placeholderTextColor="#888"
                    />
                    <ScrollView style={styles.dropdownScroll}>
                      {vendors
                        .filter(vendor => 
                          vendor.name.toLowerCase().includes(vendorSearchText.toLowerCase())
                        )
                        .map((vendor) => (
                          <TouchableOpacity
                            key={vendor.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setPayVendor(vendor.name);
                              setShowVendorDropdown(false);
                              setVendorSearchText('');
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{vendor.name}</Text>
                          </TouchableOpacity>
                        ))}
                      {vendorSearchText && vendors.filter(vendor => 
                        vendor.name.toLowerCase().includes(vendorSearchText.toLowerCase())
                      ).length === 0 && (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setPayVendor(vendorSearchText);
                            setShowVendorDropdown(false);
                            setVendorSearchText('');
                          }}
                        >
                          <Text style={styles.dropdownItemText}>Add "{vendorSearchText}"</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <TextInput placeholder="Amount" value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" style={styles.inputNew} placeholderTextColor="#888" />
              
              {/* Payment Mode Dropdown */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={payPaymentMode}
                  onValueChange={setPayPaymentMode}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Bank Transfer" value="bank" />
                  <Picker.Item label="Card" value="card" />
                </Picker>
              </View>
              
              {/* Start Date */}
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowPayStartPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#888" />
                <Text style={styles.dateButtonText}>
                  Start Date: {payStartDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {/* End Date */}
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowPayEndPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color="#888" />
                <Text style={styles.dateButtonText}>
                  End Date: {payEndDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {/* Status Dropdown */}
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={payStatus}
                  onValueChange={setPayStatus}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
              
              <Button mode="contained" onPress={handleAddPayment} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Payment</Button>
              {/* 6. Food Bill */}
              <Text style={styles.sectionTitleNew}>Food Bill</Text>
              <TextInput
                placeholder="Amount"
                value={foodBillAmount}
                onChangeText={setFoodBillAmount}
                keyboardType="numeric"
                style={styles.inputNew}
                placeholderTextColor="#888"
              />
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={foodBillPaymentMode}
                  onValueChange={setFoodBillPaymentMode}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Online" value="online" />
                  <Picker.Item label="Card" value="card" />
                </Picker>
              </View>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={foodBillStatus}
                  onValueChange={setFoodBillStatus}
                  style={styles.pickerNew}
                  itemStyle={{fontSize: 15, height: 56, textAlignVertical: 'center', color: '#222'}}>
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
              <Button mode="contained" onPress={handleAddFoodBill} style={styles.saveBtnNew} labelStyle={styles.saveBtnLabel}>Save Food Bill</Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Date Pickers */}
      {showPayStartPicker && (
        <DateTimePicker
          value={payStartDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPayStartPicker(false);
            if (selectedDate) {
              setPayStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {showPayEndPicker && (
        <DateTimePicker
          value={payEndDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPayEndPicker(false);
            if (selectedDate) {
              setPayEndDate(selectedDate);
            }
          }}
        />
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentNew: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    margin: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    minWidth: 320,
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalTitleNew: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#222',
    letterSpacing: 0.5,
  },
  sectionTitleNew: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 28,
    marginBottom: 10,
    color: PRIMARY_COLOR,
    letterSpacing: 0.2,
  },
  inputNew: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    width: 260,
    height: 56,
    marginBottom: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 15,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    justifyContent: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    width: 260,
    height: 56,
    justifyContent: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  pickerNew: {
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 15,
    height: 56,
    width: '100%',
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlignVertical: 'center',
  },
  saveBtnNew: {
    marginBottom: 14,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 10,
    minWidth: 180,
    width: 180,
    alignSelf: 'center',
    elevation: 0,
  },
  saveBtnLabel: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  dropdownContainer: {
    position: 'relative',
    width: 260,
    marginBottom: 16,
    alignSelf: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#222',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    maxHeight: 120,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    padding: 12,
    fontSize: 16,
  },
  dropdownScroll: {
    maxHeight: 80,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#222',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    minHeight: 56,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 12,
  },
  vendorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minHeight: 56,
  },
  vendorNameText: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  vendorContactText: {
    fontSize: 14,
    color: '#555',
  },
}); 
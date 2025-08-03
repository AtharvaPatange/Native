import { useAuth } from '@/components/AuthContext';
import HotelDashboard from '@/components/HotelDashboard';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addDoc, collection, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Appbar, Button, Text, TextInput } from 'react-native-paper';

export default function CatenaCafeScreen() {
  const { user, loading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Fetch unique vendor names from catenacafevendorpayments collection
  useEffect(() => {
    const fetchVendorNames = async () => {
      try {
        const paymentsQuery = query(collection(db, 'catenacafevendorpayments'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        
        // Extract unique vendor names
        const vendorNames = new Set<string>();
        paymentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.vendor && data.vendor.trim()) {
            vendorNames.add(data.vendor.trim());
          }
        });
        
        // Convert to array format for compatibility
        const vendorsData = Array.from(vendorNames).map((name, index) => ({
          id: `vendor_${index}`,
          name: name
        }));
        
        setVendors(vendorsData);
        console.log('Fetched unique vendor names:', vendorsData);
      } catch (error) {
        console.error('Error fetching vendor names:', error);
      }
    };
    fetchVendorNames();
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
  const [payPaymentMode, setPayPaymentMode] = useState('cash');
  const [payStatus, setPayStatus] = useState('pending');
  const [payStartDate, setPayStartDate] = useState(new Date());
  const [payEndDate, setPayEndDate] = useState(new Date());
  const [showPayStartPicker, setShowPayStartPicker] = useState(false);
  const [showPayEndPicker, setShowPayEndPicker] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearchText, setVendorSearchText] = useState('');

  // Raw materials purchasing state
  const [rawDate, setRawDate] = useState<Date | null>(null);
  const [showRawDatePicker, setShowRawDatePicker] = useState(false);
  const [rawItems, setRawItems] = useState([{ name: '', amount: '' }]);

  // Zomato bill state
  const [zomatoAmount, setZomatoAmount] = useState('');
  const [zomatoPaymentMode, setZomatoPaymentMode] = useState('cash');
  const [zomatoDate, setZomatoDate] = useState(new Date());
  const [showZomatoDatePicker, setShowZomatoDatePicker] = useState(false);
  const [zomatoShift, setZomatoShift] = useState('day');

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
    if (!payVendor || !payAmount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'catenacafevendorpayments'), {
        vendor: payVendor,
        amount: Number(payAmount),
        paymentMode: payPaymentMode,
        status: payStatus,
        startDate: payStartDate,
        endDate: payEndDate,
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

  const handleAddZomatoBill = async () => {
    if (!zomatoAmount) {
      Alert.alert('Error', 'Please enter the amount');
      return;
    }
    try {
      await addDoc(collection(db, 'catenacafezomato'), {
        amount: Number(zomatoAmount),
        paymentMode: zomatoPaymentMode,
        date: zomatoDate.toISOString().split('T')[0],
        shift: zomatoShift,
        createdAt: new Date(),
        createdBy: user?.email || 'guest',
      });
      setZomatoAmount('');
      setZomatoPaymentMode('cash');
      setZomatoDate(new Date());
      setZomatoShift('day');
      Alert.alert('Success', 'Zomato bill added successfully!');
    } catch (error) {
      console.error('Error adding Zomato bill:', error);
      Alert.alert('Error', 'Failed to add Zomato bill');
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
            <TextInput placeholder="Amount" value={saleCash} onChangeText={setSaleCash} keyboardType="numeric" style={styles.input} />
            <Picker
              selectedValue={saleType}
              onValueChange={setSaleType}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
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
            <TextInput placeholder="Amount" value={expenseCash} onChangeText={setExpenseCash} keyboardType="numeric" style={styles.input} />
            <Picker
              selectedValue={expenseType}
              onValueChange={setExpenseType}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
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
                  <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={true}>
                    {vendorSearchText ? (
                      // Show filtered results when searching
                      <>
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
                        {vendors.filter(vendor => 
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
                      </>
                    ) : (
                      // Show all vendors when no search text
                      <>
                        {vendors.length > 0 ? (
                          vendors.map((vendor) => (
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
                          ))
                        ) : (
                          <View style={styles.dropdownItem}>
                            <Text style={[styles.dropdownItemText, { color: '#888', fontStyle: 'italic' }]}>
                              No vendors found
                            </Text>
                          </View>
                        )}
                      </>
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
            {/* 7. Zomato Bill */}
            <Text style={styles.sectionTitle}>Zomato Bill</Text>
            <TextInput
              placeholder="Amount"
              value={zomatoAmount}
              onChangeText={setZomatoAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <Picker
              selectedValue={zomatoPaymentMode}
              onValueChange={setZomatoPaymentMode}
              style={styles.picker}
            >
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Online" value="online" />
              <Picker.Item label="Card" value="card" />
              <Picker.Item label="Bank Transfer" value="bank" />
            </Picker>
            <TouchableOpacity onPress={() => setShowZomatoDatePicker(true)} style={styles.input}>
              <TextInput
                placeholder="Select Date"
                value={zomatoDate.toISOString().split('T')[0]}
                editable={false}
                pointerEvents="none"
                style={{ backgroundColor: '#f9f9f9' }}
              />
            </TouchableOpacity>
            <Picker
              selectedValue={zomatoShift}
              onValueChange={setZomatoShift}
              style={styles.picker}
            >
              <Picker.Item label="Day" value="day" />
              <Picker.Item label="Night" value="night" />
            </Picker>
            <Button mode="contained" onPress={handleAddZomatoBill} style={styles.saveBtn}>Save Zomato Bill</Button>
            {/* 8. Daily Purchasing of Raw Materials */}
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

      {showZomatoDatePicker && (
        <DateTimePicker
          value={zomatoDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowZomatoDatePicker(false);
            if (selectedDate) {
              setZomatoDate(selectedDate);
            }
          }}
        />
      )}
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
    borderColor: PRIMARY_GREEN,
    borderRadius: 6,
    minHeight: 200,
    maxHeight: 250,
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
    padding: 10,
    fontSize: 14,
    height: 45,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    minHeight: 35,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#222',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    minHeight: 56,
    width: 260,
    alignSelf: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#222',
    marginLeft: 12,
  },
  // New styles to match Hotel Orient Elite alignment
  sectionTitleNew: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 28,
    marginBottom: 10,
    color: '#7FB069',
    letterSpacing: 0.2,
  },
  inputNew: {
    borderWidth: 1,
    borderColor: '#7FB069',
    width: 260,
    height: 56,
    marginBottom: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 15,
    shadowColor: '#7FB069',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#7FB069',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    width: 260,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#7FB069',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    alignSelf: 'center',
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
    backgroundColor: '#7FB069',
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
}); 
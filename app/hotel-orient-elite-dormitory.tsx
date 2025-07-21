import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

const BED_NUMBERS = [1, 2, 3, 4, 5, 6];

export default function HotelOrientEliteDormitory() {
  const [beds, setBeds] = useState<{ [bedNo: string]: any }>({});
  const [selectedBed, setSelectedBed] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  // Guest form state
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [showCheckinPicker, setShowCheckinPicker] = useState(false);
  const [showCheckoutPicker, setShowCheckoutPicker] = useState(false);
  const [time, setTime] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Food bill state
  const [showFoodBill, setShowFoodBill] = useState(false);
  const [foodItems, setFoodItems] = useState([{ name: '', amount: '' }]);

  // Fetch all beds
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orientEliteDormitory'), snap => {
      const data: { [bedNo: string]: any } = {};
      snap.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setBeds(data);
    });
    return () => unsub();
  }, []);

  const openBed = (bedNo: string) => {
    setSelectedBed(bedNo);
    setModalVisible(true);
    setShowAddGuest(false);
    setShowUpdate(false);
  };

  const handleAddGuest = async () => {
    if (!checkin || !checkout || !amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    await setDoc(doc(db, 'orientEliteDormitory', selectedBed!), {
      status: 'active',
      guest: {
        checkin: checkin.toISOString().split('T')[0],
        checkout: checkout.toISOString().split('T')[0],
        time: time || null,
        amount: Number(amount),
        paymentStatus,
      },
    });
    setShowAddGuest(false);
    setModalVisible(false);
    setCheckin(null);
    setCheckout(null);
    setTime('');
    setAmount('');
    setPaymentStatus('pending');
  };

  const handleSetInactive = async () => {
    await setDoc(doc(db, 'orientEliteDormitory', selectedBed!), {
      status: 'inactive',
      guest: null,
      foodBills: null,
    }, { merge: true });
    setShowUpdate(false);
    setModalVisible(false);
  };

  const handleAddFoodItem = () => setFoodItems([...foodItems, { name: '', amount: '' }]);
  const handleFoodItemChange = (idx: number, field: 'name' | 'amount', value: string) => {
    setFoodItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleSaveFoodBill = async () => {
    if (!selectedBed || foodItems.some(item => !item.name || !item.amount)) {
      Alert.alert('Error', 'Please fill all food item fields');
      return;
    }
    await setDoc(doc(db, 'orientEliteDormitory', selectedBed), {
      foodBills: foodItems.map(item => ({ name: item.name, amount: Number(item.amount) })),
    }, { merge: true });
    setShowFoodBill(false);
    setFoodItems([{ name: '', amount: '' }]);
    Alert.alert('Success', 'Food bill saved!');
  };

  const bedStatus = (bedNo: string) => beds[bedNo]?.status || 'inactive';
  const guest = (bedNo: string) => beds[bedNo]?.guest;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Dormitory Beds</Text>
      <View style={styles.grid}>
        {BED_NUMBERS.map(bedNo => {
          const occupied = bedStatus(bedNo) === 'active';
          return (
            <TouchableOpacity
              key={bedNo.toString()}
              style={[
                styles.roomBox,
                occupied
                  ? { backgroundColor: 'green', borderColor: 'green' }
                  : { backgroundColor: '#fff', borderColor: '#ccc' },
              ]}
              onPress={() => openBed(bedNo.toString())}
            >
              <Text style={styles.roomNo}>Bed {bedNo}</Text>
              {/* No icon for either vacant or occupied beds */}
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bed {selectedBed}</Text>
            {!showAddGuest && !showUpdate && (
              <>
                <Button mode="contained" style={styles.actionBtn} onPress={() => setShowAddGuest(true)}>
                  Add Guest in Bed
                </Button>
                {bedStatus(selectedBed!) === 'active' && guest(selectedBed!) && (
                  <Button mode="contained" style={styles.actionBtn} onPress={() => setShowUpdate(true)}>
                    Update Guest Details
                  </Button>
                )}
                {!showFoodBill && bedStatus(selectedBed!) === 'active' && (
                  <Button mode="contained" style={styles.actionBtn} onPress={() => setShowFoodBill(true)}>
                    Food Bill
                  </Button>
                )}
                <Button mode="text" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>Close</Button>
              </>
            )}
            {showAddGuest && (
              <>
                <TouchableOpacity onPress={() => setShowCheckinPicker(true)} style={styles.input}>
                  <TextInput
                    label="Check-in Date"
                    value={checkin ? checkin.toISOString().split('T')[0] : ''}
                    editable={false}
                    pointerEvents="none"
                    style={{ backgroundColor: '#f9f9f9' }}
                  />
                </TouchableOpacity>
                {showCheckinPicker && (
                  <DateTimePicker
                    value={checkin || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                      setShowCheckinPicker(false);
                      if (date) setCheckin(date);
                    }}
                  />
                )}
                <TouchableOpacity onPress={() => setShowCheckoutPicker(true)} style={styles.input}>
                  <TextInput
                    label="Check-out Date"
                    value={checkout ? checkout.toISOString().split('T')[0] : ''}
                    editable={false}
                    pointerEvents="none"
                    style={{ backgroundColor: '#f9f9f9' }}
                  />
                </TouchableOpacity>
                {showCheckoutPicker && (
                  <DateTimePicker
                    value={checkout || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                      setShowCheckoutPicker(false);
                      if (date) setCheckout(date);
                    }}
                  />
                )}
                <TextInput label="Time (optional)" value={time} onChangeText={setTime} style={styles.input} placeholder="HH:MM" />
                <TextInput label="Amount" value={amount} onChangeText={setAmount} style={styles.input} keyboardType="numeric" />
                <Text style={{ marginTop: 8, marginBottom: 4 }}>Payment Status</Text>
                <RadioButton.Group onValueChange={setPaymentStatus} value={paymentStatus}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RadioButton value="done" /><Text>Done</Text>
                    <RadioButton value="pending" /><Text style={{ marginLeft: 16 }}>Pending</Text>
                  </View>
                </RadioButton.Group>
                <Button mode="contained" style={styles.actionBtn} onPress={handleAddGuest}>Save Guest</Button>
                <Button mode="text" onPress={() => setShowAddGuest(false)} style={{ marginTop: 8 }}>Cancel</Button>
              </>
            )}
            {showFoodBill && bedStatus(selectedBed!) === 'active' && (
              <>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Add Food Bill</Text>
                {foodItems.map((item, idx) => (
                  <View key={String(idx)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TextInput
                      placeholder="Food Item"
                      value={item.name}
                      onChangeText={v => handleFoodItemChange(idx, 'name', v)}
                      style={[styles.input, { flex: 2, marginRight: 8 }]}
                    />
                    <TextInput
                      placeholder="Amount"
                      value={item.amount !== undefined ? String(item.amount) : ''}
                      onChangeText={v => handleFoodItemChange(idx, 'amount', v)}
                      keyboardType="numeric"
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                ))}
                <Button mode="outlined" onPress={handleAddFoodItem} style={{ marginBottom: 8 }}>Add New Item</Button>
                <Button mode="contained" onPress={async () => {
                  if (!selectedBed || foodItems.some(item => !item.name || !item.amount)) {
                    Alert.alert('Error', 'Please fill all food item fields');
                    return;
                  }
                  // Append to existing foodBills if present
                  const prev = beds[selectedBed!]?.foodBills || [];
                  await setDoc(doc(db, 'orientEliteDormitory', selectedBed!), {
                    foodBills: [...prev, ...foodItems.map(item => ({ name: item.name, amount: Number(item.amount) }))],
                  }, { merge: true });
                  setShowFoodBill(false);
                  setFoodItems([{ name: '', amount: '' }]);
                  Alert.alert('Success', 'Food bill saved!');
                }} style={styles.actionBtn}>Save</Button>
                <Button mode="text" onPress={() => setShowFoodBill(false)} style={{ marginTop: 8 }}>Cancel</Button>
              </>
            )}
            {showUpdate && guest(selectedBed!) && bedStatus(selectedBed!) === 'active' && (
              <>
                <View style={styles.guestCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="account" size={22} color={PRIMARY_COLOR} style={{ marginRight: 6 }} />
                    <Text style={styles.guestHeader}>Guest Details</Text>
                  </View>
                  <View style={styles.guestDivider} />
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Check-in</Text>
                    <Text style={styles.guestValue}>{guest(selectedBed!).checkin}</Text>
                  </View>
                  {/* Editable Checkout Date */}
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Check-out</Text>
                    <TouchableOpacity onPress={() => setShowCheckoutPicker(true)}>
                      <Text style={[styles.guestValue, { textDecorationLine: 'underline', color: PRIMARY_COLOR }]}>{checkout ? checkout.toISOString().split('T')[0] : guest(selectedBed!).checkout}</Text>
                    </TouchableOpacity>
                  </View>
                  {showCheckoutPicker && (
                    <DateTimePicker
                      value={checkout || (guest(selectedBed!).checkout ? new Date(guest(selectedBed!).checkout) : new Date())}
                      mode="date"
                      display="default"
                      onChange={(_, date) => {
                        setShowCheckoutPicker(false);
                        if (date) setCheckout(date);
                      }}
                    />
                  )}
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Time</Text>
                    <Text style={styles.guestValue}>{guest(selectedBed!).time || '-'}</Text>
                  </View>
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Amount</Text>
                    <TextInput
                      value={amount !== '' ? amount : (guest(selectedBed!) && guest(selectedBed!).amount !== undefined ? String(guest(selectedBed!).amount) : '')}
                      onChangeText={setAmount}
                      style={[styles.input, { width: 100, marginBottom: 0, backgroundColor: '#f9f9f9' }]}
                      keyboardType="numeric"
                    />
                  </View>
                  {/* Editable Payment Status */}
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Payment Status</Text>
                    <RadioButton.Group
                      onValueChange={setPaymentStatus}
                      value={paymentStatus}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <RadioButton value="done" /><Text>Done</Text>
                        <RadioButton value="pending" /><Text style={{ marginLeft: 16 }}>Pending</Text>
                      </View>
                    </RadioButton.Group>
                  </View>
                  {/* Show food bill data */}
                  {beds[selectedBed!]?.foodBills && beds[selectedBed!].foodBills.length > 0 && (
                    <View style={styles.foodBillCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={PRIMARY_COLOR} style={{ marginRight: 6 }} />
                        <Text style={styles.foodBillHeader}>Food Bill</Text>
                      </View>
                      <View style={styles.foodBillDivider} />
                      {beds[selectedBed!].foodBills.map((item: any, idx: number) => (
                        <View key={String(idx)} style={styles.foodBillRow}>
                          <Text style={styles.foodBillItem}>{item.name}</Text>
                          <Text style={styles.foodBillAmount}>₹{item.amount}</Text>
                        </View>
                      ))}
                      <View style={styles.foodBillDivider} />
                      <Text style={styles.foodBillTotal}>
                        Total: ₹{beds[selectedBed!].foodBills.reduce((sum: number, i: any): number => sum + (typeof i.amount === 'number' ? i.amount : Number(i.amount) || 0), 0)}
                      </Text>
                    </View>
                  )}
                  <Button mode="contained" style={styles.actionBtn} onPress={async () => {
                    // Save changes to checkout, amount, and payment status
                    await setDoc(doc(db, 'orientEliteDormitory', selectedBed!), {
                      guest: {
                        ...guest(selectedBed!),
                        checkout: checkout ? checkout.toISOString().split('T')[0] : guest(selectedBed!).checkout,
                        amount: amount !== '' ? Number(amount) : guest(selectedBed!).amount,
                        paymentStatus,
                      },
                    }, { merge: true });
                    Alert.alert('Success', 'Guest details updated!');
                  }}>Save Changes</Button>
                </View>
                <Button mode="contained" style={styles.actionBtn} onPress={handleSetInactive}>Set Bed Inactive</Button>
                <Button mode="text" onPress={() => setShowUpdate(false)} style={{ marginTop: 8 }}>Cancel</Button>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    minHeight: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 18,
    marginTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  roomBox: {
    width: 110,
    height: 80,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roomNo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
    color: PRIMARY_COLOR,
  },
  input: {
    width: 240,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  actionBtn: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
  },
  foodBillCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    marginBottom: 8,
    shadowColor: '#e0a86b',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0a86b',
  },
  foodBillHeader: {
    fontWeight: 'bold',
    fontSize: 17,
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  foodBillDivider: {
    height: 1,
    backgroundColor: '#e0a86b33',
    marginVertical: 8,
    borderRadius: 1,
  },
  foodBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  foodBillItem: {
    fontSize: 15,
    color: '#222',
  },
  foodBillAmount: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  foodBillTotal: {
    marginTop: 8,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    fontSize: 16,
    alignSelf: 'flex-end',
  },
  guestCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#e0a86b',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0a86b',
  },
  guestHeader: {
    fontWeight: 'bold',
    fontSize: 17,
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  guestDivider: {
    height: 1,
    backgroundColor: '#e0a86b33',
    marginVertical: 8,
    borderRadius: 1,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  guestLabel: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  guestValue: {
    fontSize: 15,
    color: '#555',
  },
  guestAmount: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
}); 
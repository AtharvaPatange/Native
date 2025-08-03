import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

const ROOM_NUMBERS = [
  ...Array.from({ length: 8 }, (_, i) => 301 + i),
  ...Array.from({ length: 8 }, (_, i) => 401 + i),
  ...Array.from({ length: 8 }, (_, i) => 501 + i),
];

export default function HotelOrientEliteRooms() {
  const [rooms, setRooms] = useState<{ [roomNo: string]: any }>({});
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
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
  // Add advance state for guest form
  const [advance, setAdvance] = useState('');
  const [editingAdvance, setEditingAdvance] = useState('');
  const [editingTotalAmount, setEditingTotalAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');

  // Fetch all rooms
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orientEliteRooms'), snap => {
      const data: { [roomNo: string]: any } = {};
      snap.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setRooms(data);
    });
    return () => unsub();
  }, []);

  const openRoom = (roomNo: string) => {
    setSelectedRoom(roomNo);
    setModalVisible(true);
    setShowAddGuest(false);
    setShowUpdate(false);
    // Reset editing values
    setEditingAdvance('');
  };

  const handleAddGuest = async () => {
    if (!checkin || !checkout || !amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    await setDoc(doc(db, 'orientEliteRooms', selectedRoom!), {
      status: 'active',
      guest: {
        checkin: checkin.toISOString().split('T')[0],
        checkout: checkout.toISOString().split('T')[0],
        time: time || null,
        amount: Number(amount),
        advance: advance !== '' ? Number(advance) : 0,
        paymentStatus,
      },
    });
    setShowAddGuest(false);
    setModalVisible(false);
    setCheckin(null);
    setCheckout(null);
    setTime('');
    setAmount('');
    setAdvance('');
    setPaymentStatus('pending');
  };

  const handleSetInactive = async () => {
    await setDoc(doc(db, 'orientEliteRooms', selectedRoom!), {
      status: 'inactive',
      guest: null, // Remove guest data
    }, { merge: true });
    setShowUpdate(false);
    setModalVisible(false);
  };

  const openUpdateView = () => {
    setShowUpdate(true);
    setShowAddGuest(false);
    // Initialize editing values with current guest data
    if (selectedRoom && guest(selectedRoom)) {
      setEditingAdvance(guest(selectedRoom).advance ? String(guest(selectedRoom).advance) : '');
      setEditingTotalAmount(guest(selectedRoom).amount ? String(guest(selectedRoom).amount) : '');
      setPaymentStatus(guest(selectedRoom).paymentStatus || 'pending');
      setCheckout(guest(selectedRoom).checkout ? new Date(guest(selectedRoom).checkout) : null);
      setAddAmount(''); // Reset add amount field
    }
  };

  const roomStatus = (roomNo: string) => rooms[roomNo]?.status || 'inactive';
  const guest = (roomNo: string) => rooms[roomNo]?.guest;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Hotel Orient Elite Rooms</Text>
      <View style={styles.grid}>
        {ROOM_NUMBERS.map(roomNo => {
          const status = roomStatus(roomNo);
          const isBooked = status === 'active';
          return (
            <TouchableOpacity
              key={roomNo.toString()}
              style={[
                styles.roomBox,
                isBooked
                  ? { backgroundColor: 'green', borderColor: 'green' }
                  : { backgroundColor: '#fff', borderColor: '#ccc' },
              ]}
              onPress={() => openRoom(roomNo.toString())}
            >
              <Text style={styles.roomNo}>Room {roomNo}</Text>
              {/* No icon for either vacant or booked rooms */}
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Room {selectedRoom}</Text>
            {!showAddGuest && !showUpdate && (
              <>
                <Button mode="contained" style={styles.actionBtn} onPress={() => setShowAddGuest(true)}>
                  Add Guest in Room
                </Button>
                {guest(selectedRoom!) && (
                  <Button mode="contained" style={styles.actionBtn} onPress={openUpdateView}>
                    Update Guest Status
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
                <TextInput label="Advance Paid (₹)" value={advance} onChangeText={setAdvance} style={styles.input} keyboardType="numeric" />
                <Button mode="contained" style={styles.actionBtn} onPress={handleAddGuest}>Save Guest</Button>
                <Button mode="text" onPress={() => setShowAddGuest(false)} style={{ marginTop: 8 }}>Cancel</Button>
              </>
            )}
            {showUpdate && selectedRoom && guest(selectedRoom) && (
              <>
                <View style={styles.guestCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="account" size={22} color={PRIMARY_COLOR} style={{ marginRight: 6 }} />
                    <Text style={styles.guestHeader}>Guest Details</Text>
                  </View>
                  <View style={styles.guestDivider} />
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Check-in</Text>
                    <Text style={styles.guestValue}>{guest(selectedRoom).checkin}</Text>
                  </View>
                  {/* Editable Checkout Date */}
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Check-out</Text>
                    <TouchableOpacity onPress={() => setShowCheckoutPicker(true)}>
                      <Text style={[styles.guestValue, { textDecorationLine: 'underline', color: PRIMARY_COLOR }]}>{checkout ? checkout.toISOString().split('T')[0] : guest(selectedRoom).checkout}</Text>
                    </TouchableOpacity>
                  </View>
                  {showCheckoutPicker && (
                    <DateTimePicker
                      value={checkout || (guest(selectedRoom).checkout ? new Date(guest(selectedRoom).checkout) : new Date())}
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
                    <Text style={styles.guestValue}>{guest(selectedRoom).time || '-'}</Text>
                  </View>
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Amount</Text>
                    <Text style={styles.guestAmount}>₹{guest(selectedRoom).amount}</Text>
                  </View>
                  {/* Package Section */}
                  <View style={[styles.guestRow, { marginTop: 12, marginBottom: 4 }]}>
                    <Text style={[styles.guestLabel, { fontWeight: 'bold' }]}>Package</Text>
                  </View>
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Total Amount</Text>
                    <TextInput
                      value={editingTotalAmount}
                      onChangeText={setEditingTotalAmount}
                      style={styles.editableAmountInput}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Advance Paid</Text>
                    <TextInput
                      value={editingAdvance}
                      onChangeText={setEditingAdvance}
                      style={styles.editableAmountInput}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                                       <View style={styles.addAmountRow}>
                      <TextInput
                        value={addAmount}
                        onChangeText={setAddAmount}
                        style={styles.addAmountInput}
                        keyboardType="numeric"
                        placeholder="Add amount"
                        placeholderTextColor="#888"
                      />
                      <Button 
                        mode="contained" 
                        onPress={() => {
                          const currentAdvance = Number(editingAdvance) || 0;
                          const addValue = Number(addAmount) || 0;
                          const totalAmount = Number(editingTotalAmount) || 0;
                          const remainingAmount = totalAmount - currentAdvance;
                          
                          if (addValue <= 0) {
                            Alert.alert('Error', 'Please enter a valid amount');
                            return;
                          }
                          
                          if (addValue > remainingAmount) {
                            Alert.alert('Error', `Cannot add more than remaining amount (₹${remainingAmount})`);
                            return;
                          }
                          
                          const newAdvance = currentAdvance + addValue;
                          setEditingAdvance(String(newAdvance));
                          setAddAmount('');
                          Alert.alert('Success', `Added ₹${addValue} to advance payment`);
                        }}
                        style={styles.addAmountButton}
                      >
                        Add
                      </Button>
                    </View>
                  <View style={styles.guestRow}>
                    <Text style={styles.guestLabel}>Pending Amount</Text>
                    <Text style={styles.guestValue}>
                      ₹{(Number(editingTotalAmount) || 0) - (Number(editingAdvance) || 0)}
                    </Text>
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
                  <Button mode="contained" style={styles.actionBtn} onPress={async () => {
                    // Save changes to checkout, advance, total amount, and payment status
                    await setDoc(doc(db, 'orientEliteRooms', selectedRoom), {
                      guest: {
                        ...guest(selectedRoom),
                        checkout: checkout ? checkout.toISOString().split('T')[0] : guest(selectedRoom).checkout,
                        amount: Number(editingTotalAmount) || 0,
                        advance: Number(editingAdvance) || 0,
                        paymentStatus,
                      },
                    }, { merge: true });
                    Alert.alert('Success', 'Guest details updated!');
                    setShowUpdate(false);
                  }}>Save Changes</Button>
                  
                  <Button 
                    mode="outlined" 
                    style={[styles.actionBtn, { marginTop: 8, borderColor: '#d32f2f' }]} 
                    onPress={handleSetInactive}
                    textColor="#d32f2f"
                  >
                    Set Room Inactive
                  </Button>
                </View>
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
  guestStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
  },
  statusDone: {
    backgroundColor: '#43a047',
    color: '#fff',
  },
     statusPending: {
     backgroundColor: '#e53935',
     color: '#fff',
   },
   addAmountRow: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 12,
     gap: 12,
   },
   addAmountInput: {
     flex: 1,
     borderWidth: 1,
     borderColor: PRIMARY_COLOR,
     width: 180,
     height: 56,
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
     alignSelf: 'center',
   },
   addAmountButton: {
     backgroundColor: PRIMARY_COLOR,
     borderRadius: 8,
     paddingVertical: 10,
     minWidth: 80,
     height: 56,
     justifyContent: 'center',
     elevation: 0,
   },
   editableAmountInput: {
     borderWidth: 1,
     borderColor: PRIMARY_COLOR,
     width: 120,
     height: 40,
     paddingVertical: 0,
     paddingHorizontal: 12,
     borderRadius: 6,
     backgroundColor: '#fff',
     color: '#222',
     fontSize: 14,
     shadowColor: PRIMARY_COLOR,
     shadowOpacity: 0.04,
     shadowRadius: 2,
     textAlign: 'center',
   },
}); 
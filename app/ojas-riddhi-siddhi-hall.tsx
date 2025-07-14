import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

export default function OjasRiddhiSiddhiHall() {
  const [guests, setGuests] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editGuest, setEditGuest] = useState<any>(null);
  const [form, setForm] = useState({
    functionName: '',
    guestName: '',
    peopleCount: '',
    amount: '',
    amountWay: 'cash',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [hallStatus, setHallStatus] = useState<'active' | 'inactive'>('inactive');

  // Fetch all bookings
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ojasRiddhiSiddhiHall'), snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGuests(data);
      setHallStatus(data.some(g => g.status === 'active') ? 'active' : 'inactive');
    });
    return () => unsub();
  }, []);

  const openAddGuest = () => {
    setForm({ functionName: '', guestName: '', peopleCount: '', amount: '', amountWay: 'cash', startDate: null, endDate: null });
    setEditGuest(null);
    setModalVisible(true);
  };

  const openEditGuest = (guest: any) => {
    setForm({
      functionName: guest.functionName,
      guestName: guest.guestName,
      peopleCount: guest.peopleCount,
      amount: guest.amount.toString(),
      amountWay: guest.amountWay,
      startDate: guest.startDate ? new Date(guest.startDate) : null,
      endDate: guest.endDate ? new Date(guest.endDate) : null,
    });
    setEditGuest(guest);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const { functionName, guestName, peopleCount, amount, amountWay, startDate, endDate } = form;
    if (!functionName || !guestName || !peopleCount || !amount || !amountWay || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const data = {
      functionName,
      guestName,
      peopleCount,
      amount: Number(amount),
      amountWay,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active',
    };
    if (editGuest) {
      await setDoc(doc(db, 'ojasRiddhiSiddhiHall', editGuest.id), data);
    } else {
      await addDoc(collection(db, 'ojasRiddhiSiddhiHall'), data);
    }
    setModalVisible(false);
  };

  const handleSetInactive = async (guest: any) => {
    await updateDoc(doc(db, 'ojasRiddhiSiddhiHall', guest.id), { status: 'inactive' });
  };

  const totalAmount = guests.reduce((sum, g) => sum + (g.amount || 0), 0);

  // PDF generation
  const handleDownloadPDF = async () => {
    const html = `
      <html><body>
      <h2>Riddhi Siddhi Hall Bookings</h2>
      <table border="1" style="border-collapse:collapse;width:100%">
        <tr><th>Function</th><th>Guest</th><th>People</th><th>Amount</th><th>Way</th><th>Start</th><th>End</th><th>Status</th></tr>
        ${guests.map(g => `<tr><td>${g.functionName}</td><td>${g.guestName}</td><td>${g.peopleCount}</td><td>₹${g.amount}</td><td>${g.amountWay}</td><td>${g.startDate}</td><td>${g.endDate}</td><td>${g.status}</td></tr>`).join('')}
      </table>
      <h3>Total Amount: ₹${totalAmount}</h3>
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Riddhi Siddhi Hall</Text>
      <Text style={[styles.statusBox, hallStatus === 'active' ? styles.activeBox : styles.inactiveBox]}>
        {hallStatus === 'active' ? 'Active' : 'Inactive'}
      </Text>
      <Button mode="contained" style={styles.addBtn} onPress={openAddGuest} icon="plus">
        Add Guest for Hall
      </Button>
      <View style={styles.guestList}>
        {guests.map(guest => (
          <View key={guest.id} style={[styles.guestCard, { borderColor: guest.status === 'active' ? 'green' : 'red' }] }>
            <Text style={styles.guestTitle}>{guest.functionName} ({guest.guestName})</Text>
            <Text>People: {guest.peopleCount}</Text>
            <Text>Amount: ₹{guest.amount} ({guest.amountWay})</Text>
            <Text>Start: {guest.startDate}</Text>
            <Text>End: {guest.endDate}</Text>
            <Text>Status: <Text style={{ color: guest.status === 'active' ? 'green' : 'red' }}>{guest.status}</Text></Text>
            <Button mode="outlined" style={styles.updateBtn} onPress={() => openEditGuest(guest)}>
              Update Guest Details
            </Button>
            {guest.status === 'active' && (
              <Button mode="contained" style={styles.inactiveBtn} onPress={() => handleSetInactive(guest)}>
                Inactive
              </Button>
            )}
          </View>
        ))}
      </View>
      <Button mode="contained" style={styles.pdfBtn} onPress={handleDownloadPDF} icon="download">
        Download PDF
      </Button>
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editGuest ? 'Update Guest Details' : 'Add Guest for Hall'}</Text>
            <TextInput label="Function Name" value={form.functionName} onChangeText={v => setForm(f => ({ ...f, functionName: v }))} style={styles.input} />
            <TextInput label="Guest Name" value={form.guestName} onChangeText={v => setForm(f => ({ ...f, guestName: v }))} style={styles.input} />
            <TextInput label="People Count" value={form.peopleCount} onChangeText={v => setForm(f => ({ ...f, peopleCount: v }))} style={styles.input} keyboardType="numeric" />
            <TextInput label="Amount" value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} style={styles.input} keyboardType="numeric" />
            <Text style={{ marginTop: 8, marginBottom: 4 }}>Amount Way</Text>
            <RadioButton.Group onValueChange={v => setForm(f => ({ ...f, amountWay: v }))} value={form.amountWay}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="cash" /><Text>Cash</Text>
                <RadioButton value="online" style={{ marginLeft: 16 }} /><Text>Online</Text>
                <RadioButton value="bank" style={{ marginLeft: 16 }} /><Text>Bank Transfer</Text>
              </View>
            </RadioButton.Group>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
              <TextInput
                label="Start Date"
                value={form.startDate ? form.startDate.toISOString().split('T')[0] : ''}
                editable={false}
                pointerEvents="none"
                style={{ backgroundColor: '#f9f9f9' }}
              />
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={form.startDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setForm(f => ({ ...f, startDate: date }));
                }}
              />
            )}
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
              <TextInput
                label="End Date"
                value={form.endDate ? form.endDate.toISOString().split('T')[0] : ''}
                editable={false}
                pointerEvents="none"
                style={{ backgroundColor: '#f9f9f9' }}
              />
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={form.endDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setForm(f => ({ ...f, endDate: date }));
                }}
              />
            )}
            <Button mode="contained" style={styles.saveBtn} onPress={handleSave}>
              Save
            </Button>
            <Button mode="text" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>Cancel</Button>
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
  addBtn: {
    marginBottom: 18,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  guestList: {
    width: '100%',
    marginBottom: 24,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  guestTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 4,
    color: '#222',
  },
  updateBtn: {
    marginTop: 8,
    borderRadius: 8,
    borderColor: PRIMARY_COLOR,
  },
  inactiveBtn: {
    marginTop: 8,
    backgroundColor: '#e53935',
    borderRadius: 8,
  },
  pdfBtn: {
    marginTop: 18,
    backgroundColor: '#1976d2',
    borderRadius: 8,
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
  saveBtn: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
  },
  statusBox: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
    alignSelf: 'center',
  },
  activeBox: {
    backgroundColor: 'green',
  },
  inactiveBox: {
    backgroundColor: 'red',
  },
}); 
import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';

export default function OjasRiddhiSiddhiHall() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [peopleCount, setPeopleCount] = useState('');
  const [amountPerPerson, setAmountPerPerson] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ojasRiddhiSiddhiHall'), snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
    });
    return () => unsub();
  }, []);

  const openAdd = () => {
    setPeopleCount('');
    setAmountPerPerson('');
    setEditBooking(null);
    setModalVisible(true);
  };

  const openEdit = (booking: any) => {
    setPeopleCount(booking.peopleCount ? String(booking.peopleCount) : '');
    setAmountPerPerson(booking.amountPerPerson ? String(booking.amountPerPerson) : '');
    setEditBooking(booking);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!peopleCount || !amountPerPerson) {
      Alert.alert('Error', 'Please enter both fields');
      return;
    }
    const data = {
      peopleCount: Number(peopleCount),
      amountPerPerson: Number(amountPerPerson),
      totalAmount: Number(peopleCount) * Number(amountPerPerson),
    };
    if (editBooking) {
      await setDoc(doc(db, 'ojasRiddhiSiddhiHall', editBooking.id), data);
    } else {
      await addDoc(collection(db, 'ojasRiddhiSiddhiHall'), data);
    }
    setModalVisible(false);
  };

  const totalAmountAll = bookings.reduce((sum, b) => sum + (b.totalAmount || (b.peopleCount || 0) * (b.amountPerPerson || 0)), 0);

  const handleDownloadPDF = async () => {
    const html = `
      <html><body>
      <h2>Riddhi Siddhi Hall Bookings</h2>
      <table border="1" style="border-collapse:collapse;width:100%">
        <tr><th>No. of People</th><th>Amount/Person</th><th>Total</th></tr>
        ${bookings.map(b => `<tr><td>${b.peopleCount}</td><td>₹${b.amountPerPerson}</td><td>₹${b.totalAmount || (b.peopleCount * b.amountPerPerson)}</td></tr>`).join('')}
      </table>
      <h3>Total Amount: ₹${totalAmountAll}</h3>
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Riddhi Siddhi Hall</Text>
      <Button mode="contained" style={styles.addBtn} onPress={openAdd} icon="plus">
        Add Booking
      </Button>
      <View style={styles.guestList}>
        {bookings.map(booking => (
          <View key={booking.id} style={styles.guestCard}>
            <Text>No. of People: {booking.peopleCount}</Text>
            <Text>Amount/Person: ₹{booking.amountPerPerson}</Text>
            <Text>Total: ₹{booking.totalAmount || (booking.peopleCount * booking.amountPerPerson)}</Text>
            <Button mode="outlined" style={styles.updateBtn} onPress={() => openEdit(booking)}>
              Update
            </Button>
          </View>
        ))}
      </View>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Total Amount: ₹{totalAmountAll}</Text>
      <Button mode="contained" style={styles.pdfBtn} onPress={handleDownloadPDF} icon="download">
        Download PDF
      </Button>
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editBooking ? 'Update Booking' : 'Add Booking'}</Text>
            <TextInput label="No. of People" value={peopleCount} onChangeText={setPeopleCount} style={styles.input} keyboardType="numeric" />
            <TextInput label="Amount per Person (₹)" value={amountPerPerson} onChangeText={setAmountPerPerson} style={styles.input} keyboardType="numeric" />
            <Text style={{ marginVertical: 8, fontWeight: 'bold' }}>Total: ₹{peopleCount && amountPerPerson ? Number(peopleCount) * Number(amountPerPerson) : 0}</Text>
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
    backgroundColor: SECONDARY_BROWN,
    minHeight: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 18,
    marginTop: 12,
  },
  addBtn: {
    marginBottom: 18,
    backgroundColor: PRIMARY_BROWN,
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
    borderColor: PRIMARY_BROWN,
  },
  guestTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 4,
    color: '#111',
  },
  updateBtn: {
    marginTop: 8,
    borderRadius: 8,
    borderColor: PRIMARY_BROWN,
  },
  pdfBtn: {
    marginTop: 18,
    backgroundColor: PRIMARY_BROWN,
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
    color: '#111',
  },
  input: {
    width: 240,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderColor: PRIMARY_BROWN,
    borderWidth: 1,
    color: '#111',
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: PRIMARY_BROWN,
  },
}); 
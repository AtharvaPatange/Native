import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Paragraph, Portal, RadioButton } from 'react-native-paper';

function formatDate(date: any) {
  if (!date) return '';
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export default function CatenaCafePaymentsPending() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'done'>('pending');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, startDate, endDate]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'catenacafesale'),
        where('status', '==', filterStatus)
      );
      const snap = await getDocs(q);
      // Filter by date range in JS
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((s: any) => {
          if (!s.createdAt) return false;
          let d = s.createdAt;
          if (d instanceof Timestamp) d = d.toDate();
          else if (typeof d === 'string') d = new Date(d);
          return d >= startDate && d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
        });
      setPayments(filtered);
    } catch (e) {
      setPayments([]);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!selected) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'catenacafesale', selected.id), { status });
      setModalVisible(false);
      setSelected(null);
      fetchPayments();
    } catch (e) {
      // handle error
    }
    setLoading(false);
  }

  async function handleDownloadReport() {
    // Generate HTML for PDF
    const html = `
      <h2>Catena Cafe Payments Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)} | Status: ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>₹${p.cash || p.amount || 0}</td>
              <td>${p.type || '-'}</td>
              <td>${p.status}</td>
              <td>${p.createdBy || '-'}</td>
              <td>${formatDate(p.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Catena Cafe Payments</Text>
      <View style={{ marginBottom: 16 }}>
        <Picker
          selectedValue={filterStatus}
          onValueChange={v => setFilterStatus(v)}
          style={{ backgroundColor: '#fff', borderRadius: 8 }}
        >
          <Picker.Item label="Pending" value="pending" />
          <Picker.Item label="Done" value="done" />
        </Picker>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={{ flex: 1, marginRight: 8 }}>
          Start: {formatDate(startDate)}
        </Button>
        <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={{ flex: 1 }}>
          End: {formatDate(endDate)}
        </Button>
      </View>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
      {/* Custom Table Header */}
      <View style={{ flexDirection: 'row', backgroundColor: '#eee', borderRadius: 6, paddingVertical: 8, marginBottom: 4 }}>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Amount</Text>
        <Text style={{ width: 16 }}> </Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Type</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>View</Text>
      </View>
      {/* Custom Table Rows */}
      {payments.map(p => (
        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8 }}>
          <Text style={{ flex: 1, textAlign: 'center' }}>{p.cash || p.amount || 0}</Text>
          <Text style={{ width: 16 }}> </Text>
          <Text style={{ flex: 1, textAlign: 'center' }}>{p.type || '-'}</Text>
          <Text style={{ flex: 1, textAlign: 'center' }}>{p.status}</Text>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Button mode="outlined" compact onPress={() => { setSelected(p); setStatus(p.status); setModalVisible(true); }}>View</Button>
          </View>
        </View>
      ))}
      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>Back</Button>
      <Button mode="contained" onPress={handleDownloadReport} style={{ marginTop: 8, backgroundColor: '#43a047' }}>
        Download Report
      </Button>
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Payment Details</Dialog.Title>
          <Dialog.Content>
            {selected && (
              <>
                <Paragraph><Text style={{ fontWeight: 'bold' }}>Created By:</Text> {selected.createdBy || '-'}</Paragraph>
                <Paragraph><Text style={{ fontWeight: 'bold' }}>Amount:</Text> ₹{selected.cash || selected.amount || 0}</Paragraph>
                <Paragraph><Text style={{ fontWeight: 'bold' }}>Type:</Text> {selected.type || '-'}</Paragraph>
                <Paragraph><Text style={{ fontWeight: 'bold' }}>Status:</Text> {selected.status}</Paragraph>
                <Paragraph><Text style={{ fontWeight: 'bold' }}>Date:</Text> {formatDate(selected.createdAt)}</Paragraph>
              </>
            )}
            <RadioButton.Group onValueChange={setStatus} value={status}>
              <RadioButton.Item label="Pending" value="pending" />
              <RadioButton.Item label="Done" value="done" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleSave} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#43a047', textAlign: 'center' },
}); 
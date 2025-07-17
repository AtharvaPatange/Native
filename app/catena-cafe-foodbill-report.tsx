import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

function formatDate(date: Date | Timestamp) {
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export default function CatenaCafeFoodBillReport() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [foodbills, setFoodBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchFoodBills();
  }, [startDate, endDate]);

  async function fetchFoodBills() {
    setLoading(true);
    try {
      const q = query(collection(db, 'catenacafefoodbills'));
      const snap = await getDocs(q);
      // Filter by date range in JS
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((f: any) => {
          if (!f.createdAt) return false;
          let d = f.createdAt;
          if (d instanceof Timestamp) d = d.toDate();
          else if (typeof d === 'string') d = new Date(d);
          return d >= startDate && d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
        });
      setFoodBills(filtered);
    } catch (e) {
      setFoodBills([]);
    }
    setLoading(false);
  }

  async function handleDownloadPDF() {
    // Generate HTML for PDF
    const html = `
      <h2>Catena Cafe Food Bills Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Payment Mode</th>
          </tr>
        </thead>
        <tbody>
          ${foodbills.map(f => `
            <tr>
              <td>${formatDate(f.createdAt)}</td>
              <td>₹${f.amount || 0}</td>
              <td>${f.status || ''}</td>
              <td>${f.paymentMode || ''}</td>
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
      <Text style={styles.title}>Catena Cafe Food Bills Report</Text>
      <View style={styles.row}>
        <Button mode="outlined" onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
          Start: {formatDate(startDate)}
        </Button>
        <Button mode="outlined" onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
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
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Date</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Amount</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Status</Text>
        <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center' }}>Payment Mode</Text>
      </View>
      {/* Custom Table Rows */}
      {foodbills.map(f => (
        <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8 }}>
          <Text style={{ flex: 1, textAlign: 'center' }}>{formatDate(f.createdAt)}</Text>
          <Text style={{ flex: 1, textAlign: 'center' }}>{f.amount || 0}</Text>
          <Text style={{ flex: 1, textAlign: 'center' }}>{f.status || ''}</Text>
          <Text style={{ flex: 1, textAlign: 'center' }}>{f.paymentMode || ''}</Text>
        </View>
      ))}
      <Button mode="contained" onPress={handleDownloadPDF} style={{ marginTop: 24, backgroundColor: '#43a047' }} loading={loading} disabled={loading || foodbills.length === 0}>
        Download PDF
      </Button>
      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>Back</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#43a047', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4 },
}); 
import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';

function formatDate(date: Date | Timestamp) {
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export default function HotelOrientEliteExpenseReport() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'expenses'),
        where('branchId', '==', 'orientElite')
      );
      const snap = await getDocs(q);
      // Filter by date range in JS
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((e: any) => {
          if (!e.createdAt) return false;
          let d = e.createdAt;
          if (d instanceof Timestamp) d = d.toDate();
          else if (typeof d === 'string') d = new Date(d);
          return d >= startDate && d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
        });
      setExpenses(filtered);
    } catch (e) {
      setExpenses([]);
    }
    setLoading(false);
  }

  function getTotal() {
    return expenses.reduce((sum, e) => sum + (e.cash || 0), 0);
  }

  async function handleDownloadPDF() {
    // Generate HTML for PDF
    const html = `
      <h2>Hotel Orient Elite Expense Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(e => `
            <tr>
              <td>${formatDate(e.createdAt)}</td>
              <td>${e.type || ''}</td>
              <td>₹${e.cash || 0}</td>
              <td>${e.status || ''}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2" style="font-weight:bold;text-align:right;">Total</td>
            <td style="font-weight:bold;">₹${getTotal()}</td>
            <td></td>
          </tr>
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
      <Text style={styles.title}>Hotel Orient Elite Expense Report</Text>
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
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Type</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>
        {expenses.map(e => (
          <DataTable.Row key={e.id}>
            <DataTable.Cell>{formatDate(e.createdAt)}</DataTable.Cell>
            <DataTable.Cell>{e.type}</DataTable.Cell>
            <DataTable.Cell numeric style={{ paddingRight: 24 }}>{e.cash}</DataTable.Cell>
            <DataTable.Cell>{e.status}</DataTable.Cell>
          </DataTable.Row>
        ))}
        <DataTable.Row>
          <DataTable.Cell>Total</DataTable.Cell>
          <DataTable.Cell><Text> </Text></DataTable.Cell>
          <DataTable.Cell numeric style={{ paddingRight: 24 }}>{getTotal()}</DataTable.Cell>
          <DataTable.Cell><Text> </Text></DataTable.Cell>
        </DataTable.Row>
      </DataTable>
      <Button mode="contained" onPress={handleDownloadPDF} style={styles.downloadBtn} loading={loading} disabled={loading || expenses.length === 0}>
        Download PDF
      </Button>
      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>Back</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#e0a86b', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4 },
  downloadBtn: { marginTop: 24, backgroundColor: '#e0a86b' },
}); 
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
  return date.toISOString().split('T')[0];
}

export default function OjasExpenseReport() {
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
        collection(db, 'ojasexpense'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59))
      );
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setExpenses([]);
    }
    setLoading(false);
  }

  function getTotal() {
    return expenses.reduce((sum, e) => sum + (e.cash || 0), 0);
  }

  async function handleDownloadPDF() {
    // Generate HTML for the PDF
    let html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h2 { color: #1976d2; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 14px; }
            th { background: #f0f4fa; }
            tfoot td { font-weight: bold; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <h2>Ojas Expense Report</h2>
          <div>Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}</div>
          <table>
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
                  <td>${e.cash || 0}</td>
                  <td>${e.status || ''}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td></td>
                <td>${getTotal()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download Ojas Expense Report' });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ojas Expense Report</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#1976d2', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4 },
  downloadBtn: { marginTop: 24, backgroundColor: '#1976d2' },
}); 
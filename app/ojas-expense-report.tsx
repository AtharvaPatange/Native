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
        <DataTable.Header style={{ backgroundColor: PRIMARY_BROWN }}>
          <DataTable.Title style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Date</Text></DataTable.Title>
          <DataTable.Title style={{ flex: 1.2, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Type</Text></DataTable.Title>
          <DataTable.Title numeric style={{ flex: 1.2, justifyContent: 'center', paddingRight: 24 }}><Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Amount</Text></DataTable.Title>
          <DataTable.Title style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Status</Text></DataTable.Title>
        </DataTable.Header>
        {expenses.map(e => (
          <DataTable.Row key={e.id} style={{ minHeight: 44 }}>
            <DataTable.Cell style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 1, minWidth: 80 }}>
              <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{formatDate(e.createdAt)}</Text>
            </DataTable.Cell>
            <DataTable.Cell style={{ flex: 1.2, justifyContent: 'center', paddingHorizontal: 6, minWidth: 80 }}>
              <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{e.type}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric style={{ flex: 1.2, justifyContent: 'center', paddingRight: 24, minWidth: 80 }}>
              <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{e.cash}</Text>
            </DataTable.Cell>
            <DataTable.Cell style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 6, minWidth: 80 }}>
              <Text
                style={{
                  color: e.status === 'done' ? '#207a3c' : e.status === 'pending' ? '#b71c1c' : '#111',
                  backgroundColor: e.status === 'done' ? '#e0f7e9' : e.status === 'pending' ? '#ffebee' : 'transparent',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  textAlign: 'center',
                  overflow: 'hidden',
                  fontWeight: 'bold',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {e.status}
              </Text>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
        <DataTable.Row style={{ backgroundColor: '#f8f8f8', minHeight: 44 }}>
          <DataTable.Cell style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>Total</Text></DataTable.Cell>
          <DataTable.Cell style={{ flex: 1.2 }}><Text style={{ textAlign: 'center' }}> </Text></DataTable.Cell>
          <DataTable.Cell numeric style={{ flex: 1.2, justifyContent: 'center', paddingRight: 24 }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>{getTotal()}</Text></DataTable.Cell>
          <DataTable.Cell style={{ flex: 1 }}><Text style={{ textAlign: 'center' }}> </Text></DataTable.Cell>
        </DataTable.Row>
      </DataTable>
      <Button mode="contained" onPress={handleDownloadPDF} style={styles.downloadBtn} loading={loading} disabled={loading || expenses.length === 0}>
        Download PDF
      </Button>
      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>Back</Button>
    </ScrollView>
  );
}

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SECONDARY_BROWN, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, color: '#111', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4, backgroundColor: PRIMARY_BROWN, color: '#fff' },
  downloadBtn: { marginTop: 24, backgroundColor: PRIMARY_BROWN },
}); 
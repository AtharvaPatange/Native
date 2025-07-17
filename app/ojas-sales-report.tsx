import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';

// Helper to format date
function formatDate(date: Date | Timestamp) {
  if (date instanceof Timestamp) date = date.toDate();
  return date.toISOString().split('T')[0];
}

export default function OjasSalesReport() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  async function fetchSales() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ojassale'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59))
      );
      const snap = await getDocs(q);
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setSales([]);
    }
    setLoading(false);
  }

  function getTotal() {
    return sales.reduce((sum, s) => sum + (s.cash || 0), 0);
  }

  async function handleDownloadPDF() {
    // Generate a simple PDF using html2pdf or expo-print (web/Expo Go limitations apply)
    // For simplicity, generate a CSV and save as .pdf for now
    let content = 'Date,Type,Amount,Status\n';
    sales.forEach(s => {
      content += `${formatDate(s.createdAt)},${s.type || ''},${s.cash || 0},${s.status || ''}\n`;
    });
    content += `Total,,${getTotal()},\n`;
    const fileUri = FileSystem.cacheDirectory + 'ojas_sales_report.csv';
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Download Ojas Sales Report' });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ojas Sales Report</Text>
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
        {sales.map(s => (
          <DataTable.Row key={s.id}>
            <DataTable.Cell>{formatDate(s.createdAt)}</DataTable.Cell>
            <DataTable.Cell>{s.type}</DataTable.Cell>
            <DataTable.Cell numeric style={{ paddingRight: 24 }}>{s.cash}</DataTable.Cell>
            <DataTable.Cell>{s.status}</DataTable.Cell>
          </DataTable.Row>
        ))}
        <DataTable.Row>
          <DataTable.Cell>Total</DataTable.Cell>
          <DataTable.Cell><Text> </Text></DataTable.Cell>
          <DataTable.Cell numeric style={{ paddingRight: 24 }}>{getTotal()}</DataTable.Cell>
          <DataTable.Cell><Text> </Text></DataTable.Cell>
        </DataTable.Row>
      </DataTable>
      <Button mode="contained" onPress={handleDownloadPDF} style={styles.downloadBtn} loading={loading} disabled={loading || sales.length === 0}>
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
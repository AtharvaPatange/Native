import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';

// Ojas Veg Restaurant Theme Colors
const OJAS_COLORS = {
  primary: '#8B4513', // Reddish-brown (like the OJAS text)
  secondary: '#228B22', // Green (like VEG)
  accent: '#DC143C', // Red (like RESTAURANT)
  highlight: '#FF8C00', // Orange (like the flower)
  background: '#FFFFFF', // White
  surface: '#F8F9FA', // Light gray for cards
  text: '#2C2C2C', // Dark text
  textLight: '#666666', // Light text
  border: '#E0E0E0', // Light border
};

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
        <Button 
          mode="outlined" 
          onPress={() => setShowStartPicker(true)} 
          style={styles.dateBtn}
          textColor={OJAS_COLORS.primary}
          buttonColor={OJAS_COLORS.background}
        >
          Start: {formatDate(startDate)}
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => setShowEndPicker(true)} 
          style={styles.dateBtn}
          textColor={OJAS_COLORS.primary}
          buttonColor={OJAS_COLORS.background}
        >
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
      <DataTable style={styles.dataTable}>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title textStyle={styles.headerText}>Date</DataTable.Title>
          <DataTable.Title textStyle={styles.headerText}>Type</DataTable.Title>
          <DataTable.Title numeric textStyle={styles.headerText}>Amount</DataTable.Title>
          <DataTable.Title textStyle={styles.headerText}>Status</DataTable.Title>
        </DataTable.Header>
        {sales.map(s => (
          <DataTable.Row key={s.id} style={styles.tableRow}>
            <DataTable.Cell><Text style={styles.cellText}>{formatDate(s.createdAt)}</Text></DataTable.Cell>
            <DataTable.Cell><Text style={styles.cellText}>{s.type}</Text></DataTable.Cell>
            <DataTable.Cell numeric style={{ paddingRight: 24 }}><Text style={styles.cellText}>{s.cash}</Text></DataTable.Cell>
            <DataTable.Cell><Text style={styles.cellText}>{s.status}</Text></DataTable.Cell>
          </DataTable.Row>
        ))}
        <DataTable.Row style={styles.totalRow}>
          <DataTable.Cell><Text style={styles.totalText}>Total</Text></DataTable.Cell>
          <DataTable.Cell><Text style={styles.totalText}> </Text></DataTable.Cell>
          <DataTable.Cell numeric style={{ paddingRight: 24 }}><Text style={styles.totalText}>{getTotal()}</Text></DataTable.Cell>
          <DataTable.Cell><Text style={styles.totalText}> </Text></DataTable.Cell>
        </DataTable.Row>
      </DataTable>
      <Button 
        mode="contained" 
        onPress={handleDownloadPDF} 
        style={styles.downloadBtn} 
        loading={loading} 
        disabled={loading || sales.length === 0}
        buttonColor={OJAS_COLORS.primary}
        textColor={OJAS_COLORS.background}
      >
        Download PDF
      </Button>
      <Button 
        mode="text" 
        onPress={() => router.back()} 
        style={{ marginTop: 16 }}
        textColor={OJAS_COLORS.primary}
      >
        Back
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: OJAS_COLORS.surface, 
    padding: 16 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 18, 
    color: OJAS_COLORS.primary, 
    textAlign: 'center' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 18 
  },
  dateBtn: { 
    flex: 1, 
    marginHorizontal: 4,
    borderColor: OJAS_COLORS.primary,
    borderRadius: 8,
  },
  dataTable: {
    backgroundColor: OJAS_COLORS.background,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tableHeader: {
    backgroundColor: OJAS_COLORS.primary,
  },
  headerText: {
    color: OJAS_COLORS.background,
    fontWeight: 'bold',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: OJAS_COLORS.border,
  },
  cellText: {
    color: OJAS_COLORS.text,
  },
  totalRow: {
    backgroundColor: OJAS_COLORS.surface,
    borderTopWidth: 2,
    borderTopColor: OJAS_COLORS.primary,
  },
  totalText: {
    color: OJAS_COLORS.primary,
    fontWeight: 'bold',
  },
  downloadBtn: { 
    marginTop: 24,
    borderRadius: 8,
    paddingVertical: 4,
  },
}); 
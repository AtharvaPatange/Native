import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Ojas Sales Report</Text>
        
        {/* Enhanced Date Selection UI */}
        <View style={styles.dateSelectionContainer}>
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateButtonContent}>
                <MaterialCommunityIcons name="calendar-start" size={20} color="#8D6748" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowEndPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateButtonContent}>
                <MaterialCommunityIcons name="calendar-end" size={20} color="#8D6748" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
          {sales.map(s => (
            <DataTable.Row key={s.id} style={{ minHeight: 44 }}>
              <DataTable.Cell style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 1, minWidth: 80 }}>
                <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{formatDate(s.createdAt)}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1.2, justifyContent: 'center', paddingHorizontal: 6, minWidth: 80 }}>
                <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{s.type}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={{ flex: 1.2, justifyContent: 'center', paddingRight: 24, minWidth: 80 }}>
                <Text style={{ color: '#111', textAlign: 'center' }} numberOfLines={1} ellipsizeMode="tail">{s.cash}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 6, minWidth: 80 }}>
                <Text
                  style={{
                    color: s.status === 'done' ? '#207a3c' : s.status === 'pending' ? '#b71c1c' : '#111',
                    backgroundColor: s.status === 'done' ? '#e0f7e9' : s.status === 'pending' ? '#ffebee' : 'transparent',
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
                  {s.status}
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
        <Button mode="contained" onPress={handleDownloadPDF} style={styles.downloadBtn} loading={loading} disabled={loading || sales.length === 0}>
          Download PDF
        </Button>
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn}>Back</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SECONDARY_BROWN,
  },
  container: { 
    flex: 1, 
    backgroundColor: SECONDARY_BROWN,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#111', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4, backgroundColor: PRIMARY_BROWN, color: '#fff' },
  downloadBtn: { marginTop: 32, backgroundColor: PRIMARY_BROWN, marginBottom: 16 },
  backBtn: { marginBottom: 20 },
  dateSelectionContainer: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#8D6748',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
}); 
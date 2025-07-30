import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, DataTable, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Hotel Orient Elite Expense Report</Text>
        
        {/* Enhanced Date Selection UI */}
        <View style={styles.dateSelectionContainer}>
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateButtonContent}>
                <MaterialCommunityIcons name="calendar-start" size={20} color="#e0a86b" />
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
                <MaterialCommunityIcons name="calendar-end" size={20} color="#e0a86b" />
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
          <DataTable.Header style={{ backgroundColor: '#f8f8f8' }}>
            <DataTable.Title style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>Date</Text></DataTable.Title>
            <DataTable.Title style={{ flex: 1.2, justifyContent: 'center' }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>Type</Text></DataTable.Title>
            <DataTable.Title numeric style={{ flex: 1.2, justifyContent: 'center', paddingRight: 24 }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>Amount</Text></DataTable.Title>
            <DataTable.Title style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: '#111', fontWeight: 'bold', textAlign: 'center' }}>Status</Text></DataTable.Title>
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
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn}>Back</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f5f6fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#e0a86b', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4 },
  downloadBtn: { marginTop: 32, backgroundColor: '#e0a86b', marginBottom: 16 },
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
    borderColor: '#e0a86b',
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
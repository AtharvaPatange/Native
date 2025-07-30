import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(date: Date | Timestamp) {
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toISOString().split('T')[0];
}

export default function CatenaCafeSalesReport() {
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
      const q = query(collection(db, 'catenacafesale'));
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
      setSales(filtered);
    } catch (e) {
      setSales([]);
    }
    setLoading(false);
  }

  async function handleDownloadPDF() {
    // Generate HTML for PDF
    const html = `
      <h2>Catena Cafe Sales Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Type</th>
            <th>Cash</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map(s => `
            <tr>
              <td>${formatDate(s.createdAt)}</td>
              <td>${s.status || ''}</td>
              <td>${s.type || ''}</td>
              <td>₹${s.cash || 0}</td>
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Catena Cafe Sales Report</Text>
        
        {/* Enhanced Date Selection UI */}
        <View style={styles.dateSelectionContainer}>
          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateButtonContent}>
                <MaterialCommunityIcons name="calendar-start" size={20} color="#A8E6A3" />
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
                <MaterialCommunityIcons name="calendar-end" size={20} color="#A8E6A3" />
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

        {/* Custom Table Header */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8', borderRadius: 6, paddingVertical: 8, marginBottom: 4 }}>
          <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center', color: '#111' }}>Date</Text>
          <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center', color: '#111' }}>Status</Text>
          <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center', color: '#111' }}>Type</Text>
          <Text style={{ flex: 1, fontWeight: 'bold', textAlign: 'center', color: '#111' }}>Cash</Text>
        </View>
        {/* Custom Table Rows */}
        {sales.map(s => (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8, minHeight: 44 }}>
            <Text style={{ flex: 1, textAlign: 'center', color: '#111' }} numberOfLines={1} ellipsizeMode="tail">{formatDate(s.createdAt)}</Text>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                color: s.status === 'done' ? '#207a3c' : s.status === 'pending' ? '#b71c1c' : '#111',
                backgroundColor: s.status === 'done' ? '#e0f7e9' : s.status === 'pending' ? '#ffebee' : 'transparent',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                overflow: 'hidden',
                fontWeight: 'bold',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {s.status || ''}
            </Text>
            <Text style={{ flex: 1, textAlign: 'center', color: '#111' }} numberOfLines={1} ellipsizeMode="tail">{s.type || ''}</Text>
            <Text style={{ flex: 1, textAlign: 'center', color: '#111' }} numberOfLines={1} ellipsizeMode="tail">{s.cash || 0}</Text>
          </View>
        ))}
        <Button mode="contained" onPress={handleDownloadPDF} style={styles.downloadBtn} loading={loading} disabled={loading || sales.length === 0}>
          Download PDF
        </Button>
        <Button mode="text" onPress={() => router.back()} style={styles.backBtn}>Back</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY_GREEN = '#A8E6A3';
const SECONDARY_GREEN = '#E8FCEB';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SECONDARY_GREEN,
  },
  container: { 
    flex: 1, 
    backgroundColor: SECONDARY_GREEN,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#111', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  dateBtn: { flex: 1, marginHorizontal: 4, backgroundColor: PRIMARY_GREEN, color: '#111' },
  downloadBtn: { marginTop: 32, backgroundColor: PRIMARY_GREEN, marginBottom: 16 },
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
    borderColor: '#A8E6A3',
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
import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

export default function HotelOrientEliteFoodBills() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }
    setLoading(true);
    try {
      // Query food bills for orientElite between dates
      const foodBillsQ = query(
        collection(db, 'foodBills'),
        where('branchId', '==', 'orientElite')
      );
      const snap = await getDocs(foodBillsQ);
      // Filter by date range
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((fb: any) => {
          if (!fb.createdAt) return false;
          const d = new Date(fb.createdAt.seconds ? fb.createdAt.seconds * 1000 : fb.createdAt);
          return d >= startDate && d <= endDate;
        });
      // Calculate total amount
      const totalAmount = filtered.reduce((sum: number, fb: any) => sum + (fb.amount || 0), 0);
      // Generate HTML for PDF
      const html = `
        <h2>Food Bills (Hotel Orient Elite)</h2>
        <p>From: ${startDate.toLocaleDateString()} To: ${endDate.toLocaleDateString()}</p>
        <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((fb: any) => `
              <tr>
                <td>${fb.createdAt && fb.createdAt.seconds ? new Date(fb.createdAt.seconds * 1000).toLocaleDateString() : ''}</td>
                <td>${fb.paymentMode || '-'}</td>
                <td>${fb.status || '-'}</td>
                <td>₹${fb.amount || 0}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" style="font-weight:bold;text-align:right;">Total Amount</td>
              <td style="font-weight:bold;">₹${totalAmount}</td>
            </tr>
          </tbody>
        </table>
      `;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF generated', 'PDF file created at: ' + uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF.');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Food Bills - Hotel Orient Elite</Text>
      <View style={styles.pickerRow}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.pickerBtn}>
          <Text style={styles.pickerLabel}>Start Date</Text>
          <Text style={styles.pickerValue}>{startDate ? startDate.toLocaleDateString() : 'Select'}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.pickerBtn}>
          <Text style={styles.pickerLabel}>End Date</Text>
          <Text style={styles.pickerValue}>{endDate ? endDate.toLocaleDateString() : 'Select'}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </View>
      <Button mode="contained" style={styles.downloadBtn} onPress={handleDownloadPDF} loading={loading} disabled={loading} icon="download">
        Download PDF
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    minHeight: '100%',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 24,
    marginTop: 12,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 18,
  },
  pickerBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    minWidth: 120,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  downloadBtn: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    minWidth: 180,
  },
}); 
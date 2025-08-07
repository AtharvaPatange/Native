import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

const PRIMARY_GREEN = '#7FB069';
const SECONDARY_GREEN = '#A8D5BA';

export default function CatenaCafeZomatoReport() {
  const [zomatoBills, setZomatoBills] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchZomatoBills = async () => {
    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const q = query(
        collection(db, 'catenacafezomato'),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );
      
      const querySnapshot = await getDocs(q);
      const bills = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setZomatoBills(bills);
    } catch (error) {
      console.error('Error fetching Zomato bills:', error);
      Alert.alert('Error', 'Failed to fetch Zomato bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZomatoBills();
  }, [startDate, endDate]);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleDownloadPDF = async () => {
    const totalAmount = zomatoBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const dayBills = zomatoBills.filter(bill => bill.shift === 'day');
    const nightBills = zomatoBills.filter(bill => bill.shift === 'night');
    const dayTotal = dayBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const nightTotal = nightBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #7FB069; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .total { font-weight: bold; color: #7FB069; }
          </style>
        </head>
        <body>
          <h1>Catena Cafe Zomato Bills Report</h1>
          <p><strong>Date Range:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (₹)</th>
                <th>Payment Mode</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${zomatoBills.map(bill => `
                <tr>
                  <td>${bill.date}</td>
                  <td>₹${bill.amount}</td>
                  <td>${bill.paymentMode}</td>
                  <td>${bill.shift}</td>
                  <td>${bill.status || 'Pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Bills:</strong> ${zomatoBills.length}</p>
            <p><strong>Day Shift Total:</strong> ₹${dayTotal}</p>
            <p><strong>Night Shift Total:</strong> ₹${nightTotal}</p>
            <p class="total"><strong>Grand Total:</strong> ₹${totalAmount}</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const totalAmount = zomatoBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const dayBills = zomatoBills.filter(bill => bill.shift === 'day');
  const nightBills = zomatoBills.filter(bill => bill.shift === 'night');
  const dayTotal = dayBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const nightTotal = nightBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="food" size={32} color={PRIMARY_GREEN} />
        <Text style={styles.headerText}>Zomato Bills Report</Text>
      </View>

      {/* Date Selection */}
      <View style={styles.dateContainer}>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Start Date:</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowStartDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_GREEN} />
            <Text style={styles.dateButtonText}>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>End Date:</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowEndDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_GREEN} />
            <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Bills</Text>
          <Text style={styles.summaryValue}>{zomatoBills.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Day Shift</Text>
          <Text style={styles.summaryValue}>₹{dayTotal}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Night Shift</Text>
          <Text style={styles.summaryValue}>₹{nightTotal}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Grand Total</Text>
          <Text style={[styles.summaryValue, { color: PRIMARY_GREEN }]}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Bills List */}
      <View style={styles.billsContainer}>
        <Text style={styles.sectionTitle}>Zomato Bills</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : zomatoBills.length === 0 ? (
          <Text style={styles.noDataText}>No Zomato bills found for the selected date range</Text>
        ) : (
          zomatoBills.map((bill, index) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billHeader}>
                <Text style={styles.billDate}>{bill.date}</Text>
                <View style={[
                  styles.shiftBadge,
                  bill.shift === 'day' ? styles.dayBadge : styles.nightBadge
                ]}>
                  <Text style={styles.shiftText}>{bill.shift}</Text>
                </View>
              </View>
              <View style={styles.billDetails}>
                <Text style={styles.billAmount}>₹{bill.amount}</Text>
                <Text style={styles.billPaymentMode}>{bill.paymentMode}</Text>
              </View>
              <Text style={styles.billStatus}>Status: {bill.status || 'Pending'}</Text>
            </View>
          ))
        )}
      </View>

      {/* Download Button */}
      <Button 
        mode="contained" 
        style={styles.downloadBtn} 
        onPress={handleDownloadPDF}
        icon="download"
      >
        Download Report
      </Button>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
    marginLeft: 12,
  },
  dateContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  billsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  shiftBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadge: {
    backgroundColor: '#e3f2fd',
  },
  nightBadge: {
    backgroundColor: '#f3e5f5',
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
  },
  billPaymentMode: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  billStatus: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  downloadBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
    marginBottom: 20,
  },
});
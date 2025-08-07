import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY_GREEN = '#A8E6A3';
const SECONDARY_GREEN = '#E8FCEB';
const DARK_GREEN = '#4CAF50';

export default function CatenaRawMaterials() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'catenaRawPurchases'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const rawData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(rawData);
      setFilteredData(rawData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    filterDataByDateRange();
  }, [data, startDate, endDate]);

  const filterDataByDateRange = () => {
    // If no dates are selected, show all data
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }
    
    // If only start date is selected
    if (startDate && !endDate) {
      const filtered = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate;
      });
      setFilteredData(filtered);
      return;
    }
    
    // If only end date is selected
    if (!startDate && endDate) {
      const filtered = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate <= endDate;
      });
      setFilteredData(filtered);
      return;
    }
    
    // If both dates are selected
    if (startDate && endDate) {
      const filtered = data.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
      setFilteredData(filtered);
      return;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateTotalAmount = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const downloadReport = async () => {
    try {
      const dataToExport = filteredData.length > 0 ? filteredData : data;
      
      if (dataToExport.length === 0) {
        alert('No data to download');
        return;
      }

      // Flatten the data structure to get all items
      const allItems: any[] = [];
      dataToExport.forEach(entry => {
        if (entry.items && Array.isArray(entry.items)) {
          entry.items.forEach((item: any) => {
            allItems.push({
              date: entry.date,
              itemName: item.name,
              amount: item.amount
            });
          });
        }
      });

      if (allItems.length === 0) {
        alert('No items found in the data');
        return;
      }

      // Calculate totals
      const totalAmount = allItems.reduce((sum, item) => sum + (item.amount || 0), 0);

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Catena Cafe Raw Materials Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #A8D5BA; padding-bottom: 10px; }
            .header h1 { color: #A8D5BA; margin: 0; }
            .date-range { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #A8D5BA; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .totals { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .totals h3 { color: #A8D5BA; margin: 0 0 10px 0; }
            .total-row { font-weight: bold; background-color: #A8D5BA; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Catena Cafe Raw Materials Report</h1>
          </div>
          
          <div class="date-range">
            ${startDate && endDate 
              ? `Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
              : 'All Data'
            }
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item Name</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map(item => `
                <tr>
                  <td>${item.date ? new Date(item.date.seconds ? item.date.seconds * 1000 : item.date).toLocaleDateString() : 'N/A'}</td>
                  <td>${item.itemName || 'N/A'}</td>
                  <td>₹${item.amount || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <h3>Summary</h3>
            <table>
              <tr class="total-row">
                <td colspan="2">Total Items: ${allItems.length}</td>
                <td>Total Amount: ₹${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Catena Cafe Raw Materials Management System</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Raw Materials Report'
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="shopping" size={32} color={DARK_GREEN} />
        <Text style={styles.header}>Catena Cafe Raw Materials</Text>
        <Text style={styles.subHeader}>Purchase Records & Inventory</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="loading" size={48} color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading raw materials data...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color={PRIMARY_GREEN} />
            <Text style={styles.emptyText}>No raw materials data found</Text>
            <Text style={styles.emptySubText}>Purchase records will appear here</Text>
          </View>
        ) : (
          <>
            {/* <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="calendar" size={24} color={DARK_GREEN} />
                  <Text style={styles.summaryLabel}>Total Days</Text>
                  <Text style={styles.summaryValue}>{data.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="package-variant" size={24} color={DARK_GREEN} />
                  <Text style={styles.summaryLabel}>Total Items</Text>
                  <Text style={styles.summaryValue}>
                    {data.reduce((sum, entry) => sum + (entry.items?.length || 0), 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="currency-inr" size={24} color={DARK_GREEN} />
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>
                    ₹{data.reduce((sum, entry) => sum + calculateTotalAmount(entry.items || []), 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View> */}

            {data.map((entry, index) => (
              <Card key={entry.id} style={[styles.card, index === 0 && styles.firstCard]}>
                <Card.Title 
                  title={formatDate(entry.date)}
                  titleStyle={styles.cardTitle}
                  left={(props) => (
                    <MaterialCommunityIcons 
                      {...props} 
                      name="calendar-check" 
                      size={24} 
                      color={DARK_GREEN} 
                    />
                  )}
                />
                <Card.Content style={styles.cardContent}>
                  {entry.items?.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <MaterialCommunityIcons name="package-variant" size={16} color={PRIMARY_GREEN} />
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <Text style={styles.itemAmount}>₹{item.amount?.toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <MaterialCommunityIcons name="currency-inr" size={20} color={DARK_GREEN} />
                    <Text style={styles.dayTotal}>
                      Day Total: ₹{calculateTotalAmount(entry.items || []).toLocaleString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GREEN,
    marginLeft: 8,
  },
  dateSelectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: SECONDARY_GREEN,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_GREEN,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for download button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  firstCard: {
    borderLeftColor: DARK_GREEN,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GREEN,
  },
  cardContent: {
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_GREEN,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: SECONDARY_GREEN,
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_GREEN,
    marginLeft: 8,
  },
}); 
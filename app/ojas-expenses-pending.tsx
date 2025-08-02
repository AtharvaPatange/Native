import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, Portal, RadioButton } from 'react-native-paper';

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';
const DARK_BROWN = '#5D4037';

function formatDate(date: any) {
  if (!date) return '';
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default function OjasExpensesPending() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'done'>('pending');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [editStatus, setEditStatus] = useState<'pending' | 'done'>('pending');

  useEffect(() => {
    fetchExpenses();
  }, [filterStatus, startDate, endDate]);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'ojasexpense'),
        where('status', '==', filterStatus)
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

  async function handleDownloadReport() {
    // Generate HTML for PDF
    const html = `
      <h2>Hotel Ojas Pending Expenses Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)} | Status: ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(e => `
            <tr>
              <td>₹${e.cash || 0}</td>
              <td>${e.type || '-'}</td>
              <td>${e.status || '-'}</td>
              <td>${formatDate(e.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
    }
  }

  function openModal(expense: any) {
    setSelected(expense);
    setEditStatus(expense.status || 'pending');
    setModalVisible(true);
  }

  async function handleUpdateStatus() {
    if (!selected) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'ojasexpense', selected.id), { status: editStatus });
      setModalVisible(false);
      setSelected(null);
      fetchExpenses();
    } catch (e) {
      // handle error
    }
    setLoading(false);
  }

  const getStatusIcon = (status: string) => {
    return status === 'pending' ? 'clock-outline' : 'check-circle';
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' ? '#ff9800' : '#4caf50';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return 'credit-card';
      case 'card': return 'credit-card-outline';
      case 'bank': return 'bank';
      default: return 'cash';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="bank" size={28} color={DARK_BROWN} />
        <Text style={styles.header}>Pending Expenses</Text>
        <Text style={styles.subHeader}>Manage and track expense status</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filters Section */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <View style={styles.filterRow}>
              <View style={styles.pickerContainer}>
                <MaterialCommunityIcons name="filter-variant" size={20} color={PRIMARY_BROWN} />
        <Picker
          selectedValue={filterStatus}
          onValueChange={v => setFilterStatus(v)}
                  style={styles.picker}
        >
          <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Completed" value="done" />
        </Picker>
      </View>
            </View>
            
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartPicker(true)}
              >
                <MaterialCommunityIcons name="calendar-start" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.dateButtonText}>Start: {formatDate(startDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndPicker(true)}
              >
                <MaterialCommunityIcons name="calendar-end" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.dateButtonText}>End: {formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="currency-inr" size={24} color={DARK_BROWN} />
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>
                  ₹{expenses.reduce((sum, e) => sum + (e.cash || 0), 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="format-list-numbered" size={24} color={DARK_BROWN} />
                <Text style={styles.summaryLabel}>Total Records</Text>
                <Text style={styles.summaryValue}>{expenses.length}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="bank-remove" size={64} color={PRIMARY_BROWN} />
              <Text style={styles.emptyText}>No {filterStatus} expenses found</Text>
              <Text style={styles.emptySubText}>Try adjusting your filters or date range</Text>
            </Card.Content>
          </Card>
        ) : (
          expenses.map((expense, index) => (
            <Card key={expense.id} style={[styles.expenseCard, index === 0 && styles.firstCard]}>
              <Card.Content>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <MaterialCommunityIcons 
                      name={getTypeIcon(expense.type)} 
                      size={24} 
                      color={PRIMARY_BROWN} 
                    />
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseAmount}>₹{(expense.cash || 0).toLocaleString()}</Text>
                      <Text style={styles.expenseType}>{expense.type || 'Cash'}</Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons 
                      name={getStatusIcon(expense.status)} 
                      size={20} 
                      color={getStatusColor(expense.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
                      {expense.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.expenseFooter}>
                  <View style={styles.expenseMeta}>
                    <MaterialCommunityIcons name="account" size={16} color="#666" />
                    <Text style={styles.metaText}>{expense.createdBy || 'Unknown'}</Text>
                  </View>
                  <View style={styles.expenseMeta}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                    <Text style={styles.metaText}>{formatDate(expense.createdAt)}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openModal(expense)}
                >
                  <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            onPress={() => { if (typeof window !== 'undefined' && window.history) window.history.back(); }} 
            style={styles.backButton}
            textColor={PRIMARY_BROWN}
            icon="arrow-left"
          >
            Back
        </Button>
          <Button 
            mode="contained" 
            onPress={handleDownloadReport} 
            style={styles.downloadButton}
            buttonColor={PRIMARY_BROWN}
            icon="download"
          >
            Download Report
        </Button>
      </View>
      </ScrollView>

      {/* Date Pickers */}
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

      {/* Details Modal */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Expense Details</Dialog.Title>
          <Dialog.Content>
            {selected && (
              <View style={styles.dialogContent}>
                <View style={styles.dialogRow}>
                  <MaterialCommunityIcons name="account" size={20} color={PRIMARY_BROWN} />
                  <Text style={styles.dialogLabel}>Created By:</Text>
                  <Text style={styles.dialogValue}>{selected.createdBy || '-'}</Text>
                </View>
                <View style={styles.dialogRow}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color={PRIMARY_BROWN} />
                  <Text style={styles.dialogLabel}>Amount:</Text>
                  <Text style={styles.dialogValue}>₹{(selected.cash || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.dialogRow}>
                  <MaterialCommunityIcons name={getTypeIcon(selected.type)} size={20} color={PRIMARY_BROWN} />
                  <Text style={styles.dialogLabel}>Type:</Text>
                  <Text style={styles.dialogValue}>{selected.type || '-'}</Text>
                </View>
                <View style={styles.dialogRow}>
                  <MaterialCommunityIcons name={getStatusIcon(selected.status)} size={20} color={getStatusColor(selected.status)} />
                  <Text style={styles.dialogLabel}>Status:</Text>
                  <Text style={[styles.dialogValue, { color: getStatusColor(selected.status) }]}>{selected.status}</Text>
                </View>
                <View style={styles.dialogRow}>
                  <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_BROWN} />
                  <Text style={styles.dialogLabel}>Date:</Text>
                  <Text style={styles.dialogValue}>{formatDate(selected.createdAt)}</Text>
                </View>
              </View>
            )}
            <View style={styles.statusSelector}>
              <Text style={styles.statusSelectorLabel}>Update Status:</Text>
            <RadioButton.Group onValueChange={v => setEditStatus(v as 'pending' | 'done')} value={editStatus}>
                <RadioButton.Item label="Pending" value="pending" color={PRIMARY_BROWN} />
                <RadioButton.Item label="Completed" value="done" color={PRIMARY_BROWN} />
            </RadioButton.Group>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)} textColor={PRIMARY_BROWN}>Cancel</Button>
            <Button onPress={handleUpdateStatus} loading={loading} textColor={PRIMARY_BROWN}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_BROWN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginTop: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filterCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    flex: 1,
    marginHorizontal: 4,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: DARK_BROWN,
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginTop: 2,
  },
  expenseCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BROWN,
  },
  firstCard: {
    borderLeftColor: DARK_BROWN,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseDetails: {
    marginLeft: 12,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_BROWN,
  },
  expenseType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  emptyContent: {
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
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
    borderColor: PRIMARY_BROWN,
  },
  downloadButton: {
    flex: 1,
    marginLeft: 8,
  },
  dialogTitle: {
    color: DARK_BROWN,
    fontWeight: 'bold',
  },
  dialogContent: {
    marginBottom: 16,
  },
  dialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  dialogValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
  },
  statusSelector: {
    marginTop: 16,
  },
  statusSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
}); 
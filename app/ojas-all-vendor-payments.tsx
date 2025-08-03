import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, Portal } from 'react-native-paper';

const PRIMARY_COLOR = '#8D6748';
const SECONDARY_COLOR = '#CBB292';
const DARK_BROWN = '#6B4C1B';

function formatDate(date: any) {
  if (!date) return '';
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'done': return 'check-circle';
    case 'pending': return 'clock-outline';
    default: return 'help-circle-outline';
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'done': return '#4caf50';
    case 'pending': return '#ff9800';
    default: return '#9e9e9e';
  }
}

function getPaymentModeIcon(mode: string) {
  switch (mode?.toLowerCase()) {
    case 'cash': return 'cash';
    case 'online': return 'credit-card';
    case 'bank': return 'bank';
    case 'card': return 'credit-card-outline';
    default: return 'cash-multiple';
  }
}

export default function OjasAllVendorPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchAllPayments();
  }, [startDate, endDate]);

  async function fetchAllPayments() {
    setLoading(true);
    try {
      const q = query(collection(db, 'ojasvendorpayments'));
      const snap = await getDocs(q);
      
      // Create date range for filtering
      const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
      
      console.log('Filtering payments between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());
      
      const filtered = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((p: any) => {
          // Check if payment has startDate and endDate
          if (!p.startDate || !p.endDate) {
            console.log('Payment without startDate or endDate:', p.id);
            return false;
          }
          
          // Convert startDate and endDate to Date objects
          let paymentStartDate = p.startDate;
          let paymentEndDate = p.endDate;
          
          if (paymentStartDate instanceof Timestamp) {
            paymentStartDate = paymentStartDate.toDate();
          } else if (typeof paymentStartDate === 'string') {
            paymentStartDate = new Date(paymentStartDate);
          }
          
          if (paymentEndDate instanceof Timestamp) {
            paymentEndDate = paymentEndDate.toDate();
          } else if (typeof paymentEndDate === 'string') {
            paymentEndDate = new Date(paymentEndDate);
          }
          
          // Check if the payment's start date AND end date are both within the selected date range
          // A payment is included only if BOTH start and end dates fall within the selected range
          const paymentStartsInRange = paymentStartDate >= startOfDay && paymentStartDate <= endOfDay;
          const paymentEndsInRange = paymentEndDate >= startOfDay && paymentEndDate <= endOfDay;
          
          const isInRange = paymentStartsInRange && paymentEndsInRange;
          
          console.log(`Payment ${p.id}:`, {
            vendor: p.vendor,
            startDate: paymentStartDate.toISOString(),
            endDate: paymentEndDate.toISOString(),
            inRange: isInRange,
            startsInRange: paymentStartsInRange,
            endsInRange: paymentEndsInRange
          });
          
          return isInRange;
        });
      
      console.log(`Found ${filtered.length} payments in date range out of ${snap.docs.length} total`);
      setPayments(filtered);
    } catch (e) {
      console.error('Error fetching payments:', e);
      setPayments([]);
    }
    setLoading(false);
  }

  async function handleDownloadReport() {
    const html = `
      <h2>Hotel Ojas All Vendor Payments Report</h2>
      <p>From: ${formatDate(startDate)} To: ${formatDate(endDate)}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Amount</th>
            <th>Payment Mode</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Created Date</th>
            <th>Created By</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>${p.vendor || '-'}</td>
              <td>₹${p.amount?.toLocaleString() || 0}</td>
              <td>${p.paymentMode || '-'}</td>
              <td>${p.status || '-'}</td>
              <td>${formatDate(p.startDate)}</td>
              <td>${formatDate(p.endDate)}</td>
              <td>${formatDate(p.createdAt)}</td>
              <td>${p.createdBy || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p><strong>Total Payments:</strong> ${payments.length}</p>
      <p><strong>Total Amount:</strong> ₹${payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF', UTI: 'com.adobe.pdf' });
    }
  }

  const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const doneCount = payments.filter(p => p.status === 'done').length;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="account-group" size={28} color={DARK_BROWN} />
        <Text style={styles.header}>All Vendor Payments</Text>
        <Text style={styles.subHeader}>Complete vendor payment history</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date Filter Card */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <Text style={styles.filterTitle}>Date Range Filter</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.dateButtonText}>
                  Start: {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndPicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.dateButtonText}>
                  End: {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={fetchAllPayments}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Refresh Data</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Payments</Text>
                <Text style={styles.summaryValue}>{payments.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>{pendingCount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Completed</Text>
                <Text style={styles.summaryValue}>{doneCount}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Payments List */}
        {loading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading payments...</Text>
            </Card.Content>
          </Card>
        ) : payments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <MaterialCommunityIcons name="file-document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No payments found</Text>
              <Text style={styles.emptySubText}>Try adjusting your date range</Text>
            </Card.Content>
          </Card>
        ) : (
          payments.map((payment, index) => (
            <Card key={payment.id} style={styles.paymentCard}>
              <Card.Content>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.vendorName}>{payment.vendor}</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons 
                      name={getStatusIcon(payment.status)} 
                      size={20} 
                      color={getStatusColor(payment.status)} 
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.paymentDetails}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons 
                      name={getPaymentModeIcon(payment.paymentMode)} 
                      size={16} 
                      color={PRIMARY_COLOR} 
                    />
                    <Text style={styles.detailLabel}>Payment Mode:</Text>
                    <Text style={styles.detailValue}>{payment.paymentMode || 'Cash'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="currency-inr" size={16} color={PRIMARY_COLOR} />
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.amountText}>₹{payment.amount?.toLocaleString()}</Text>
                  </View>
                  
                  {payment.startDate && payment.endDate && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-range" size={16} color={PRIMARY_COLOR} />
                      <Text style={styles.detailLabel}>Period:</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => {
                    setSelected(payment);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Download Report Button */}
        <Card style={styles.downloadCard}>
          <Card.Content>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={handleDownloadReport}
            >
              <MaterialCommunityIcons name="download" size={24} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Report</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Details Modal */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)} style={styles.modal}>
          <Dialog.Title style={styles.modalTitle}>Payment Details</Dialog.Title>
          <Dialog.Content>
            {selected && (
              <View style={styles.modalContent}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Vendor:</Text>
                  <Text style={styles.modalValue}>{selected.vendor}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Amount:</Text>
                  <Text style={styles.modalValue}>₹{selected.amount?.toLocaleString()}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Payment Mode:</Text>
                  <Text style={styles.modalValue}>{selected.paymentMode || 'Cash'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text style={[styles.modalValue, { color: getStatusColor(selected.status) }]}>
                    {selected.status?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Created Date:</Text>
                  <Text style={styles.modalValue}>{formatDate(selected.createdAt)}</Text>
                </View>
                {selected.startDate && selected.endDate && (
                  <>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Start Date:</Text>
                      <Text style={styles.modalValue}>{formatDate(selected.startDate)}</Text>
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>End Date:</Text>
                      <Text style={styles.modalValue}>{formatDate(selected.endDate)}</Text>
                    </View>
                  </>
                )}
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Created By:</Text>
                  <Text style={styles.modalValue}>{selected.createdBy || 'Unknown'}</Text>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'column',
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    width: 260,
    alignSelf: 'center',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#222',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b4c1b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  paymentCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  loadingCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  emptyCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  downloadCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  modal: {
    borderRadius: 12,
  },
  modalTitle: {
    color: '#222',
    fontWeight: 'bold',
  },
  modalContent: {
    marginTop: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  modalValue: {
    fontSize: 14,
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
}); 
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, Portal, RadioButton } from 'react-native-paper';

const PRIMARY_COLOR = '#7FB069';
const SECONDARY_COLOR = '#D4E6C3';
const DARK_GREEN = '#1a3d1a';

function formatDate(date: any) {
  if (!date) return '';
  if (date instanceof Timestamp) date = date.toDate();
  if (typeof date === 'string') date = new Date(date);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'paid':
      return 'check-circle';
    case 'pending':
      return 'clock-outline';
    default:
      return 'help-circle-outline';
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'paid':
      return '#4caf50';
    case 'pending':
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
}

function getPaymentModeIcon(mode: string) {
  switch (mode?.toLowerCase()) {
    case 'cash':
      return 'cash';
    case 'online':
      return 'credit-card';
    case 'bank':
      return 'bank';
    case 'card':
      return 'credit-card-outline';
    default:
      return 'cash-multiple';
  }
}

export default function CatenaCafeMaintenancePayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'done'>('pending');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, startDate, endDate]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'catenacafevendorpayments'),
        where('status', '==', filterStatus)
      );
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

  async function handleSave() {
    if (!selected) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'catenacafevendorpayments', selected.id), { status });
      
      // If status is changed to 'done', add to expenses
      if (status === 'done' && selected.status !== 'done') {
        await addDoc(collection(db, 'catenacafeexpense'), {
          cash: selected.amount,
          online: 0,
          pending: 0,
          type: selected.paymentMode || 'cash',
          status: 'done',
          description: `Vendor Payment - ${selected.vendor}`,
          vendorName: selected.vendor,
          vendorStartDate: selected.startDate,
          vendorEndDate: selected.endDate,
          vendorPaymentMode: selected.paymentMode || 'cash',
          vendorAmount: selected.amount,
          isVendorPayment: true,
          createdAt: new Date(),
          createdBy: selected.createdBy || 'system',
        });
      }
      
      setModalVisible(false);
      fetchPayments();
      Alert.alert('Success', 'Payment status updated!');
    } catch (e) {
      console.error('Error updating payment:', e);
      Alert.alert('Error', 'Failed to update payment status.');
    }
    setLoading(false);
  }

  const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="wrench" size={28} color={DARK_GREEN} />
        <Text style={styles.header}>Vendors Bill</Text>
        <Text style={styles.subHeader}>Manage vendor payments</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Filter Card */}
        <Card style={styles.filterCard}>
          <Card.Content>
            <Text style={styles.filterTitle}>Filter & Date Range</Text>
            <View style={styles.filterRow}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterStatus}
                  onValueChange={setFilterStatus}
                  style={styles.picker}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Done" value="done" />
                </Picker>
              </View>
            </View>
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
          </Card.Content>
        </Card>

        {/* Check All Vendor Payments Button */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <TouchableOpacity 
              style={styles.checkAllButton}
              onPress={() => router.push('/catena-cafe-all-vendor-payments')}
            >
              <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
              <Text style={styles.checkAllButtonText}>Check All Vendor Payments</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
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
              <Text style={styles.emptySubText}>Try adjusting your filters or date range</Text>
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
                    setStatus(payment.status);
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
                
                <View style={styles.statusUpdateSection}>
                  <Text style={styles.statusUpdateLabel}>Update Status:</Text>
                  <RadioButton.Group onValueChange={value => setStatus(value)} value={status}>
                    <View style={styles.radioRow}>
                      <RadioButton value="pending" />
                      <Text style={styles.radioLabel}>Pending</Text>
                    </View>
                    <View style={styles.radioRow}>
                      <RadioButton value="done" />
                      <Text style={styles.radioLabel}>Done</Text>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleSave} loading={loading}>Update</Button>
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
  filterRow: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  picker: {
    height: 50,
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
  summaryCard: {
    marginBottom: 16,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#1a3d1a',
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
  statusUpdateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusUpdateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#222',
    marginLeft: 8,
  },
  actionCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  checkAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    borderRadius: 8,
  },
  checkAllButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
}); 
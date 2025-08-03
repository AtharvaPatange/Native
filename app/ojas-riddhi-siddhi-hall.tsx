import { db } from '@/constants/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';

export default function OjasRiddhiSiddhiHall() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editBooking, setEditBooking] = useState<any>(null);
  const [peopleCount, setPeopleCount] = useState('');
  const [amountPerPerson, setAmountPerPerson] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [paymentType, setPaymentType] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [addAmount, setAddAmount] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ojasRiddhiSiddhiHall'), snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation date (newest first)
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setBookings(sortedData);
    });
    return () => unsub();
  }, []);

  const openAdd = () => {
    setPeopleCount('');
    setAmountPerPerson('');
    setStartDate(new Date());
    setEndDate(new Date());
    setPaymentType('cash');
    setAmountPaid('');
    setDiscountAmount('0');
    setAddAmount('');
    setEditBooking(null);
    setModalVisible(true);
  };

  const openEdit = (booking: any) => {
    setPeopleCount(booking.peopleCount ? String(booking.peopleCount) : '');
    setAmountPerPerson(booking.amountPerPerson ? String(booking.amountPerPerson) : '');
    setStartDate(booking.startDate ? (booking.startDate.toDate ? new Date(booking.startDate.toDate()) : new Date(booking.startDate)) : new Date());
    setEndDate(booking.endDate ? (booking.endDate.toDate ? new Date(booking.endDate.toDate()) : new Date(booking.endDate)) : new Date());
    setPaymentType(booking.paymentType || 'cash');
    setAmountPaid(booking.amountPaid ? String(booking.amountPaid) : '');
    setDiscountAmount(booking.discountAmount ? String(booking.discountAmount) : '0');
    setAddAmount('');
    setEditBooking(booking);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!peopleCount || !amountPerPerson || !amountPaid) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const totalAmount = Number(peopleCount) * Number(amountPerPerson);
    const discount = Number(discountAmount) || 0;
    const finalAmount = totalAmount - discount;
    const paidAmount = Number(amountPaid);
    const remainingAmount = finalAmount - paidAmount;

    if (paidAmount > finalAmount) {
      Alert.alert('Error', 'Amount paid cannot be greater than final amount after discount');
      return;
    }

    const data = {
      peopleCount: Number(peopleCount),
      amountPerPerson: Number(amountPerPerson),
      totalAmount: totalAmount,
      discountAmount: discount,
      finalAmount: finalAmount,
      startDate: startDate,
      endDate: endDate,
      paymentType: paymentType,
      amountPaid: paidAmount,
      amountRemaining: remainingAmount,
      status: 'active', // Set status to active when adding new booking
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (editBooking) {
        await updateDoc(doc(db, 'ojasRiddhiSiddhiHall', editBooking.id), data);
        Alert.alert('Success', 'Booking updated successfully');
      } else {
        await addDoc(collection(db, 'ojasRiddhiSiddhiHall'), data);
        Alert.alert('Success', 'Booking added successfully');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save booking');
      console.error('Error saving booking:', error);
    }
  };

  const handleSetInactive = async () => {
    if (!editBooking) return;
    
    try {
      await updateDoc(doc(db, 'ojasRiddhiSiddhiHall', editBooking.id), {
        status: 'inactive',
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Hall status set to inactive');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update hall status');
      console.error('Error updating hall status:', error);
    }
  };

  const totalAmountAll = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalDiscountAll = bookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
  const totalFinalAmountAll = bookings.reduce((sum, b) => sum + (b.finalAmount || b.totalAmount || 0), 0);
  const totalPaidAll = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalRemainingAll = bookings.reduce((sum, b) => sum + (b.amountRemaining || 0), 0);

  // Get active and inactive counts
  const activeBookings = bookings.filter(b => b.status !== 'inactive');
  const inactiveBookings = bookings.filter(b => b.status === 'inactive');

  // Show only 5 recent entries unless "View More" is clicked
  const displayedBookings = showAllBookings ? bookings : bookings.slice(0, 5);

  const handleDownloadPDF = async () => {
    const html = `
      <html><body>
      <h2>Riddhi Siddhi Hall Bookings</h2>
      <table border="1" style="border-collapse:collapse;width:100%">
        <tr>
          <th>No. of People</th>
          <th>Amount/Person</th>
          <th>Total</th>
          <th>Discount</th>
          <th>Final Amount</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Payment Type</th>
          <th>Amount Paid</th>
          <th>Remaining</th>
          <th>Status</th>
        </tr>
        ${bookings.map(b => `
          <tr>
            <td>${b.peopleCount}</td>
            <td>₹${b.amountPerPerson}</td>
            <td>₹${b.totalAmount}</td>
            <td>₹${b.discountAmount || 0}</td>
            <td>₹${b.finalAmount || b.totalAmount}</td>
            <td>${b.startDate ? (b.startDate.toDate ? new Date(b.startDate.toDate()).toLocaleDateString() : new Date(b.startDate).toLocaleDateString()) : 'N/A'}</td>
            <td>${b.endDate ? (b.endDate.toDate ? new Date(b.endDate.toDate()).toLocaleDateString() : new Date(b.endDate).toLocaleDateString()) : 'N/A'}</td>
            <td>${b.paymentType}</td>
            <td>₹${b.amountPaid}</td>
            <td>₹${b.amountRemaining}</td>
            <td>${b.status || 'active'}</td>
          </tr>
        `).join('')}
      </table>
      <h3>Summary:</h3>
      <p>Total Amount: ₹${totalAmountAll}</p>
      <p>Total Discount: ₹${totalDiscountAll}</p>
      <p>Final Amount: ₹${totalFinalAmountAll}</p>
      <p>Total Paid: ₹${totalPaidAll}</p>
      <p>Total Remaining: ₹${totalRemainingAll}</p>
      <p>Active Halls: ${activeBookings.length}</p>
      <p>Inactive Halls: ${inactiveBookings.length}</p>
      </body></html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Riddhi Siddhi Hall</Text>
      <Button mode="contained" style={styles.addBtn} onPress={openAdd} icon="plus">
        Add Booking
      </Button>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Amount: ₹{totalAmountAll}</Text>
        {/* <Text style={styles.summaryText}>Total Discount: ₹{totalDiscountAll}</Text>
        <Text style={styles.summaryText}>Final Amount: ₹{totalFinalAmountAll}</Text> */}
        <Text style={styles.summaryText}>Total Paid: ₹{totalPaidAll}</Text>
        <Text style={styles.summaryText}>Total Remaining: ₹{totalRemainingAll}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, styles.activeStatus]}>Active Halls: {activeBookings.length}</Text>
          <Text style={[styles.statusText, styles.inactiveStatus]}>Inactive Halls: {inactiveBookings.length}</Text>
        </View>
      </View>

      <View style={styles.guestList}>
        {displayedBookings.map(booking => (
          <View key={booking.id} style={[
            styles.guestCard,
            booking.status === 'inactive' && styles.inactiveCard
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.guestTitle}>Booking Details</Text>
              <View style={[
                styles.statusBadge,
                booking.status === 'inactive' ? styles.inactiveBadge : styles.activeBadge
              ]}>
                <Text style={styles.statusBadgeText}>
                  {booking.status === 'inactive' ? 'Inactive' : 'Active'}
                </Text>
              </View>
            </View>
            <Text>No. of People: {booking.peopleCount}</Text>
            <Text>Amount/Person: ₹{booking.amountPerPerson}</Text>
            <Text>Total: ₹{booking.totalAmount}</Text>
            {booking.discountAmount > 0 && (
              <Text style={styles.discountText}>Discount: ₹{booking.discountAmount}</Text>
            )}
            <Text style={styles.finalAmountText}>Final Amount: ₹{booking.finalAmount || booking.totalAmount}</Text>
            <Text>Start Date: {booking.startDate ? (booking.startDate.toDate ? new Date(booking.startDate.toDate()).toLocaleDateString() : new Date(booking.startDate).toLocaleDateString()) : 'N/A'}</Text>
            {(() => {
              const endDateObj = booking.endDate ? (booking.endDate.toDate ? new Date(booking.endDate.toDate()) : new Date(booking.endDate)) : null;
              const isActive = booking.status !== 'inactive';
              const isPast = endDateObj && isActive && (new Date().setHours(0,0,0,0) > endDateObj.setHours(0,0,0,0));
              return (
                <Text style={isPast ? [styles.endDate, styles.pastEndDate] : styles.endDate}>
                  End Date: {endDateObj ? endDateObj.toLocaleDateString() : 'N/A'}
                </Text>
              );
            })()}
            <Text>Payment Type: {booking.paymentType}</Text>
            <Text>Amount Paid: ₹{booking.amountPaid}</Text>
            <Text style={booking.amountRemaining > 0 ? styles.remainingText : styles.paidText}>
              Remaining: ₹{booking.amountRemaining}
            </Text>
            <Button mode="outlined" style={styles.updateBtn} onPress={() => openEdit(booking)}>
              Update Details
            </Button>
          </View>
        ))}
      </View>

      {bookings.length > 5 && (
        <Button 
          mode="text" 
          style={styles.viewMoreBtn} 
          onPress={() => setShowAllBookings(!showAllBookings)}
        >
          {showAllBookings ? 'Show Less' : `View More (${bookings.length - 5} more)`}
        </Button>
      )}
      
      <Button mode="contained" style={styles.pdfBtn} onPress={handleDownloadPDF} icon="download">
        Download PDF
      </Button>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editBooking ? 'Update Booking' : 'Add Booking'}</Text>
              
              <TextInput 
                label="No. of People" 
                value={peopleCount} 
                onChangeText={setPeopleCount} 
                style={styles.inputNew} 
                keyboardType="numeric" 
                placeholderTextColor="#888"
              />
              
              <TextInput 
                label="Amount per Person (₹)" 
                value={amountPerPerson} 
                onChangeText={setAmountPerPerson} 
                style={styles.inputNew} 
                keyboardType="numeric" 
                placeholderTextColor="#888"
              />

              <Text style={styles.totalText}>
                Total: ₹{peopleCount && amountPerPerson ? Number(peopleCount) * Number(amountPerPerson) : 0}
              </Text>

              <TextInput 
                label="Discount Amount (₹)" 
                value={discountAmount} 
                onChangeText={setDiscountAmount} 
                style={styles.inputNew} 
                keyboardType="numeric" 
                placeholderTextColor="#888"
              />

              <Text style={styles.finalAmountText}>
                Final Amount: ₹{
                  peopleCount && amountPerPerson 
                    ? Math.max(0, (Number(peopleCount) * Number(amountPerPerson)) - (Number(discountAmount) || 0))
                    : 0
                }
              </Text>

              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>End Date:</Text>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text>{endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.paymentContainer}>
                <Text style={styles.paymentLabel}>Payment Type:</Text>
                <RadioButton.Group onValueChange={value => setPaymentType(value)} value={paymentType}>
                  <View style={styles.radioContainer}>
                    <RadioButton.Item label="Cash" value="cash" />
                    <RadioButton.Item label="Online" value="online" />
                  </View>
                </RadioButton.Group>
              </View>

              <TextInput 
                label="Amount Paid (₹)" 
                value={amountPaid} 
                onChangeText={setAmountPaid} 
                style={styles.inputNew} 
                keyboardType="numeric" 
                placeholderTextColor="#888"
              />

              <View style={styles.addAmountRow}>
                <TextInput
                  value={addAmount}
                  onChangeText={setAddAmount}
                  style={styles.addAmountInput}
                  keyboardType="numeric"
                  placeholder="Add amount"
                  placeholderTextColor="#888"
                />
                <Button 
                  mode="contained" 
                  onPress={() => {
                    const currentPaid = Number(amountPaid) || 0;
                    const addValue = Number(addAmount) || 0;
                    const totalAmount = Number(peopleCount) * Number(amountPerPerson);
                    const discount = Number(discountAmount) || 0;
                    const finalAmount = totalAmount - discount;
                    const remainingAmount = finalAmount - currentPaid;
                    
                    if (addValue <= 0) {
                      Alert.alert('Error', 'Please enter a valid amount');
                      return;
                    }
                    
                    if (addValue > remainingAmount) {
                      Alert.alert('Error', `Cannot add more than remaining amount (₹${remainingAmount})`);
                      return;
                    }
                    
                    const newPaid = currentPaid + addValue;
                    setAmountPaid(String(newPaid));
                    setAddAmount('');
                    Alert.alert('Success', `Added ₹${addValue} to amount paid`);
                  }}
                  style={styles.addAmountButton}
                >
                  Add
                </Button>
              </View>

              <Text style={styles.remainingText}>
                Amount Remaining: ₹{
                  peopleCount && amountPerPerson && amountPaid 
                    ? Math.max(0, ((Number(peopleCount) * Number(amountPerPerson)) - (Number(discountAmount) || 0)) - Number(amountPaid))
                    : 0
                }
              </Text>

              <Button mode="contained" style={styles.saveBtn} onPress={handleSave}>
                Save
              </Button>

              {editBooking && (
                <Button 
                  mode="outlined" 
                  style={styles.setInactiveBtn} 
                  onPress={handleSetInactive}
                  textColor="#d32f2f"
                >
                  Set Hall Inactive
                </Button>
              )}

              <Button mode="text" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
                Cancel
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
    padding: 16,
    alignItems: 'center',
    backgroundColor: SECONDARY_BROWN,
    minHeight: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 18,
    marginTop: 12,
  },
  addBtn: {
    marginBottom: 18,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
    borderWidth: 2,
    borderColor: PRIMARY_BROWN,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStatus: {
    color: '#388e3c',
  },
  inactiveStatus: {
    color: '#d32f2f',
  },
  guestList: {
    width: '100%',
    marginBottom: 24,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderColor: PRIMARY_BROWN,
  },
  inactiveCard: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  guestTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#388e3c',
  },
  inactiveBadge: {
    backgroundColor: '#d32f2f',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  remainingText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  paidText: {
    color: '#388e3c',
    fontWeight: 'bold',
  },
  updateBtn: {
    marginTop: 8,
    borderRadius: 8,
    borderColor: PRIMARY_BROWN,
  },
  viewMoreBtn: {
    marginBottom: 18,
  },
  pdfBtn: {
    marginTop: 18,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    margin: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    minWidth: 320,
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#222',
    letterSpacing: 0.5,
  },
  input: {
    width: 240,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderColor: PRIMARY_BROWN,
    borderWidth: 1,
    color: '#111',
  },
  inputNew: {
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    width: 260,
    height: 56,
    marginBottom: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 15,
    shadowColor: PRIMARY_BROWN,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  totalText: {
    marginVertical: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: 240,
  },
  dateLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#111',
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  paymentContainer: {
    width: 240,
    marginBottom: 12,
  },
  paymentLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  saveBtn: {
    marginTop: 10,
    marginBottom: 14,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 8,
    paddingVertical: 10,
    minWidth: 180,
    width: 180,
    alignSelf: 'center',
    elevation: 0,
  },
  setInactiveBtn: {
    marginTop: 8,
    borderRadius: 8,
    borderColor: '#d32f2f',
  },
  endDate: {
    marginTop: 4,
    fontSize: 14,
    color: '#111',
  },
  pastEndDate: {
    color: '#d32f2f',
  },
  discountText: {
    color: '#ff9800',
    fontWeight: 'bold',
    fontSize: 14,
  },
  finalAmountText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  addAmountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    width: 180,
    height: 56,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 15,
    shadowColor: PRIMARY_BROWN,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  addAmountButton: {
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 8,
    paddingVertical: 10,
    minWidth: 80,
    height: 56,
    justifyContent: 'center',
    elevation: 0,
  },
}); 
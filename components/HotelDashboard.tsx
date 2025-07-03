import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface HotelDashboardProps {
  branchId: string;
  branchName: string;
}

interface Sale {
  id: string;
  cash: number;
  online: number;
  pending: number;
  branchId: string;
  createdAt?: { seconds: number };
  createdBy: string;
}
interface Expense {
  id: string;
  cash: number;
  online: number;
  pending: number;
  branchId: string;
  createdAt?: { seconds: number };
  createdBy: string;
}
interface Maintenance {
  id: string;
  desc: string;
  room: string;
  status: string;
  branchId: string;
  createdAt?: { seconds: number };
  createdBy: string;
}
interface Vendor {
  id: string;
  name: string;
  contact: string;
  branchId: string;
}
interface Payment {
  id: string;
  vendor: string;
  amount: number;
  status: string;
  branchId: string;
  createdAt?: { seconds: number };
  createdBy: string;
}

// Color palette for Hotel Orient Elite
const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

const summaryStyles = StyleSheet.create({
  card: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
  },
  value: { fontSize: 22, fontWeight: 'bold', marginTop: 6, color: '#222' },
  label: { fontSize: 13, color: '#6b4c1b', marginTop: 2, textAlign: 'center' },
});

export default function HotelDashboard({ branchId, branchName }: HotelDashboardProps) {
  const { user, userRole } = useAuth();
  const router = useRouter();
  // 1. Sales
  const [sale, setSale] = useState({ cash: '', online: '', pending: '' });
  const [salesList, setSalesList] = useState<Sale[]>([]);
  // 2. Expenses
  const [expense, setExpense] = useState({ cash: '', online: '', pending: '' });
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  // 3. Vendors
  const [vendor, setVendor] = useState({ name: '', contact: '' });
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  // 4. Maintenance
  const [maintenance, setMaintenance] = useState({ desc: '', room: '', status: 'Unresolved' });
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);
  // 5. Vendor Payments
  const [payment, setPayment] = useState({ vendor: '', amount: '', status: 'pending' });
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  // State for custom legend selection
  const [selectedSeries, setSelectedSeries] = useState<'sales' | 'expenses' | null>(null);
  // State for per-point tooltip
  const [pointTooltip, setPointTooltip] = useState<{ x: number; y: number; value: number; label: string; color: string; series: string } | null>(null);

  // Prepare chart data for sales and expenses (last 7 days)
  const isOrientElite = branchId === 'orientElite';
  let chartLabels: string[] = [];
  let salesData: number[] = [];
  let expensesData: number[] = [];
  if (isOrientElite) {
    // Group sales and expenses by day (last 7 days)
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      chartLabels.push(label);
      // Sales sum for this day
      const salesSum = salesList
        .filter(s => {
          if (!s.createdAt) return false;
          const date = new Date(s.createdAt.seconds * 1000);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, s) => sum + (s.cash || 0) + (s.online || 0), 0);
      salesData.push(salesSum);
      // Expenses sum for this day
      const expenseSum = expensesList
        .filter(e => {
          if (!e.createdAt) return false;
          const date = new Date(e.createdAt.seconds * 1000);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, e) => sum + (e.cash || 0) + (e.online || 0), 0);
      expensesData.push(expenseSum);
    }
  }

  // Calculate summary stats for today
  let todaySales = 0, todayExpenses = 0, vendorCount = 0, openMaintCount = 0, paidPayments = 0, pendingPayments = 0;
  if (isOrientElite) {
    const now = new Date();
    todaySales = salesList.filter(s => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt.seconds * 1000);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, s) => sum + (s.cash || 0) + (s.online || 0), 0);
    todayExpenses = expensesList.filter(e => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt.seconds * 1000);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, e) => sum + (e.cash || 0) + (e.online || 0), 0);
    vendorCount = vendorsList.length;
    openMaintCount = maintenanceList.filter(m => m.status?.toLowerCase() !== 'resolved').length;
    paidPayments = paymentsList.filter(p => p.status === 'paid').length;
    pendingPayments = paymentsList.filter(p => p.status === 'pending').length;
  }

  // Calculate totals and averages for tooltip
  const salesTotal = salesData.reduce((a, b) => a + b, 0);
  const salesAvg = salesData.length ? Math.round(salesTotal / salesData.length) : 0;
  const expensesTotal = expensesData.reduce((a, b) => a + b, 0);
  const expensesAvg = expensesData.length ? Math.round(expensesTotal / expensesData.length) : 0;

  useEffect(() => {
    // Sales
    const salesQ = query(collection(db, 'sales'), where('branchId', '==', branchId));
    const unsubSales = onSnapshot(salesQ, snap => {
      const data = snap.docs.map(d => ({ ...(d.data() as Sale), id: d.id }));
      setSalesList(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    // Expenses
    const expensesQ = query(collection(db, 'expenses'), where('branchId', '==', branchId));
    const unsubExpenses = onSnapshot(expensesQ, snap => {
      const data = snap.docs.map(d => ({ ...(d.data() as Expense), id: d.id }));
      setExpensesList(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    // Vendors
    const vendorsQ = query(collection(db, 'vendors'), where('branchId', '==', branchId));
    const unsubVendors = onSnapshot(vendorsQ, snap => setVendorsList(snap.docs.map(d => ({ ...(d.data() as Vendor), id: d.id }))));
    // Maintenance
    const maintQ = query(collection(db, 'maintenanceLogs'), where('branchId', '==', branchId));
    const unsubMaint = onSnapshot(maintQ, snap => {
      const data = snap.docs.map(d => ({ ...(d.data() as Maintenance), id: d.id }));
      setMaintenanceList(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    // Vendor Payments
    const payQ = query(collection(db, 'vendorPayments'), where('branchId', '==', branchId));
    const unsubPay = onSnapshot(payQ, snap => setPaymentsList(snap.docs.map(d => ({ ...(d.data() as Payment), id: d.id }))));
    return () => { unsubSales(); unsubExpenses(); unsubVendors(); unsubMaint(); unsubPay(); };
  }, [branchId]);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: PRIMARY_COLOR }}>{branchName} Dashboard</Text>
      {isOrientElite && (
        <>
          <View style={{ marginBottom: 32, backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, marginTop: 24, borderColor: PRIMARY_COLOR, borderWidth: 1 }}>
            <View style={{ position: 'relative' }}>
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [
                    { data: salesData, color: () => selectedSeries === null || selectedSeries === 'sales' ? '#1976d2' : 'rgba(25,118,210,0.3)', strokeWidth: 3, withDots: true },
                    { data: expensesData, color: () => selectedSeries === null || selectedSeries === 'expenses' ? '#e53935' : 'rgba(229,57,53,0.3)', strokeWidth: 3, withDots: true },
                  ],
                  legend: [],
                }}
                width={Dimensions.get('window').width - 48}
                height={260}
                yAxisLabel="₹"
                yAxisSuffix=""
                yLabelsOffset={8}
                xLabelsOffset={-4}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff', pointerEvents: 'auto' },
                  propsForBackgroundLines: { stroke: '#e0e0e0', strokeDasharray: '4' },
                  propsForLabels: { fontWeight: 'bold', fontSize: 14 },
                  style: { borderRadius: 18 },
                  fillShadowGradient: '#000',
                  fillShadowGradientOpacity: 0.04,
                }}
                bezier
                style={{ borderRadius: 18 }}
                fromZero
                segments={5}
                formatYLabel={y => `${y}`}
                onDataPointClick={({ value, index, x, y }) => {
                  let series = '';
                  let color = '';
                  if (salesData[index] === value) {
                    series = 'Sales';
                    color = '#1976d2';
                  } else if (expensesData[index] === value) {
                    series = 'Expenses';
                    color = '#e53935';
                  }
                  setPointTooltip({
                    x,
                    y,
                    value,
                    label: chartLabels[index],
                    color,
                    series,
                  });
                }}
              />
              {/* Per-point Tooltip Box as overlay */}
              {pointTooltip && (
                <View style={{ position: 'absolute', left: pointTooltip.x - 80, top: pointTooltip.y - 90, backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: 140, minHeight: 70, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 3, zIndex: 20, alignItems: 'flex-start', borderWidth: 1, borderColor: '#eee' }}>
                  <MaterialCommunityIcons name="close" size={20} color="#222" onPress={() => setPointTooltip(null)} style={{ position: 'absolute', top: 8, right: 8 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: pointTooltip.series === 'Sales' ? '#1976d2' : '#e53935', marginBottom: 4, marginTop: 8, textAlign: 'left' }}>{pointTooltip.series}</Text>
                  <Text style={{ fontSize: 15, color: '#222', fontWeight: 'bold', textAlign: 'left' }}>₹{pointTooltip.value}</Text>
                  <Text style={{ fontSize: 13, color: '#888', marginTop: 2, textAlign: 'left' }}>{pointTooltip.label}</Text>
                </View>
              )}
            </View>
            {/* Custom Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#222', marginRight: 6, borderWidth: selectedSeries === 'sales' ? 2 : 0, borderColor: '#222', opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ color: '#222', fontWeight: selectedSeries === 'sales' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.5 }}>Sales</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 32 }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#888', marginRight: 6, borderWidth: selectedSeries === 'expenses' ? 2 : 0, borderColor: '#888', opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ color: '#888', fontWeight: selectedSeries === 'expenses' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.5 }}>Expenses</Text>
              </View>
            </View>
          </View>
          {/* Section Header for Summary */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 10, marginLeft: 2, marginTop: 8 }}>Today&apos;s Summary</Text>
          {/* Summary Cards Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18, columnGap: 12, marginBottom: 24 }}>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="cash" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>₹{todaySales}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Today&apos;s Sales</Text>
            </View>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="bank" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>₹{todayExpenses}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Today&apos;s Expenses</Text>
            </View>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff' }]} onPress={() => router.push('/hotel-orient-elite-vendors')}>
              <MaterialCommunityIcons name="account-group" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{vendorCount}</Text>
              <Text style={summaryStyles.label}>Vendors</Text>
            </TouchableOpacity>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="wrench" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{openMaintCount}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Open Maintenance</Text>
            </View>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="check-circle" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{paidPayments}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Payments Paid</Text>
            </View>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="clock-outline" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{pendingPayments}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Payments Pending</Text>
            </View>
          </View>
        </>
      )}
      {/* For other branches, keep the old UI (if needed) */}
      {!isOrientElite && (
        <>
      {userRole && (
        <Text style={{ alignSelf: 'center', backgroundColor: '#1976d2', color: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12, fontWeight: 'bold', fontSize: 14 }}>
          Role: {userRole}
        </Text>
      )}
      {/* 1. Today&apos;s Total Sale */}
      <Text style={styles.sectionTitle}>1. Today&apos;s Total Sale</Text>
      <View style={styles.card}>
        <TextInput placeholder="Cash" value={sale.cash} onChangeText={v => setSale(s => ({ ...s, cash: v }))} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Online (Card/Bank)" value={sale.online} onChangeText={v => setSale(s => ({ ...s, online: v }))} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Pending" value={sale.pending} onChangeText={v => setSale(s => ({ ...s, pending: v }))} keyboardType="numeric" style={styles.input} />
        <Button title="Add Sale" onPress={async () => {
          await addDoc(collection(db, 'sales'), {
            ...sale,
            cash: Number(sale.cash),
            online: Number(sale.online),
            pending: Number(sale.pending),
            branchId,
            createdAt: new Date(),
            createdBy: user?.email,
          });
          setSale({ cash: '', online: '', pending: '' });
        }} />
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Recent Sales:</Text>
        {salesList.map((s, i) => (
          <Text key={s.id || i} style={{ fontSize: 12 }}>Cash: {s.cash} | Online: {s.online} | Pending: {s.pending} | By: {s.createdBy}</Text>
        ))}
      </View>

      {/* 2. Today&apos;s Total Expense */}
      <Text style={styles.sectionTitle}>2. Today&apos;s Total Expense</Text>
      <View style={styles.card}>
        <TextInput placeholder="Cash" value={expense.cash} onChangeText={v => setExpense(s => ({ ...s, cash: v }))} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Online" value={expense.online} onChangeText={v => setExpense(s => ({ ...s, online: v }))} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Pending" value={expense.pending} onChangeText={v => setExpense(s => ({ ...s, pending: v }))} keyboardType="numeric" style={styles.input} />
        <Button title="Add Expense" onPress={async () => {
          await addDoc(collection(db, 'expenses'), {
            ...expense,
            cash: Number(expense.cash),
            online: Number(expense.online),
            pending: Number(expense.pending),
            branchId,
            createdAt: new Date(),
            createdBy: user?.email,
          });
          setExpense({ cash: '', online: '', pending: '' });
        }} />
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Recent Expenses:</Text>
        {expensesList.map((e, i) => (
          <Text key={e.id || i} style={{ fontSize: 12 }}>Cash: {e.cash} | Online: {e.online} | Pending: {e.pending} | By: {e.createdBy}</Text>
        ))}
      </View>

      {/* 3. Vendor List */}
      <Text style={styles.sectionTitle}>3. Vendor List</Text>
      <View style={styles.card}>
        <TextInput placeholder="Vendor Name" value={vendor.name} onChangeText={v => setVendor(s => ({ ...s, name: v }))} style={styles.input} />
        <TextInput placeholder="Contact Number" value={vendor.contact} onChangeText={v => setVendor(s => ({ ...s, contact: v }))} keyboardType="phone-pad" style={styles.input} />
        <Button title="Add Vendor" onPress={async () => {
          await addDoc(collection(db, 'vendors'), {
            ...vendor,
            branchId,
          });
          setVendor({ name: '', contact: '' });
        }} />
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Vendors:</Text>
        {vendorsList.map((v, i) => (
          <View key={v.id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>{v.name} | {v.contact}</Text>
            <Button title="Delete" onPress={async () => { await deleteDoc(doc(db, 'vendors', v.id)); }} />
          </View>
        ))}
      </View>

      {/* 4. Maintenance */}
      <Text style={styles.sectionTitle}>4. Maintenance</Text>
      <View style={styles.card}>
        <TextInput placeholder="Description" value={maintenance.desc} onChangeText={v => setMaintenance(s => ({ ...s, desc: v }))} style={styles.input} />
        <TextInput placeholder="Room Number (optional)" value={maintenance.room} onChangeText={v => setMaintenance(s => ({ ...s, room: v }))} style={styles.input} />
        <TextInput placeholder="Status (Resolved/Unresolved)" value={maintenance.status} onChangeText={v => setMaintenance(s => ({ ...s, status: v }))} style={styles.input} />
        <Button title="Add Maintenance Log" onPress={async () => {
          await addDoc(collection(db, 'maintenanceLogs'), {
            ...maintenance,
            branchId,
            createdAt: new Date(),
            createdBy: user?.email,
          });
          setMaintenance({ desc: '', room: '', status: 'Unresolved' });
        }} />
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Logs:</Text>
        {maintenanceList.map((m, i) => (
          <Text key={m.id || i} style={{ fontSize: 12 }}>{m.desc} | Room: {m.room} | Status: {m.status} | By: {m.createdBy}</Text>
        ))}
      </View>

      {/* 5. Vendor Payment */}
      <Text style={styles.sectionTitle}>5. Vendor Payment</Text>
      <View style={styles.card}>
        <TextInput placeholder="Vendor Name" value={payment.vendor} onChangeText={v => setPayment(s => ({ ...s, vendor: v }))} style={styles.input} />
        <TextInput placeholder="Amount" value={payment.amount} onChangeText={v => setPayment(s => ({ ...s, amount: v }))} keyboardType="numeric" style={styles.input} />
        <TextInput placeholder="Status (paid/pending)" value={payment.status} onChangeText={v => setPayment(s => ({ ...s, status: v }))} style={styles.input} />
        <Button title="Add Payment" onPress={async () => {
          await addDoc(collection(db, 'vendorPayments'), {
            ...payment,
            amount: Number(payment.amount),
            branchId,
            createdAt: new Date(),
            createdBy: user?.email,
          });
          setPayment({ vendor: '', amount: '', status: 'pending' });
        }} />
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>✅ Already Paid:</Text>
        {paymentsList.filter(p => p.status === 'paid').map((p, i) => (
          <Text key={p.id || i} style={{ fontSize: 12 }}>{p.vendor} | Amount: {p.amount} | By: {p.createdBy}</Text>
        ))}
        <Text style={{ marginTop: 8, fontWeight: 'bold' }}>🕗 Payment Pending:</Text>
        {paymentsList.filter(p => p.status === 'pending').map((p, i) => (
          <Text key={p.id || i} style={{ fontSize: 12 }}>{p.vendor} | Amount: {p.amount} | By: {p.createdBy}</Text>
        ))}
      </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
}); 
import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

export default function HotelDashboard({ branchId, branchName }: HotelDashboardProps) {
  const { user, userRole } = useAuth();
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
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>{branchName} Dashboard</Text>
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
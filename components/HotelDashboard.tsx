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
  status?: string; // Add this line
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

// Ojas Veg Restaurant Theme Colors
const OJAS_COLORS = {
  primary: '#8B4513', // Reddish-brown (like the OJAS text)
  secondary: '#228B22', // Green (like VEG)
  accent: '#DC143C', // Red (like RESTAURANT)
  highlight: '#FF8C00', // Orange (like the flower)
  background: '#FFFFFF', // White
  surface: '#F8F9FA', // Light gray for cards
  text: '#2C2C2C', // Dark text
  textLight: '#666666', // Light text
  border: '#E0E0E0', // Light border
};

// Catena Cafe Theme Colors
const CATENA_COLORS = {
  primary: '#388e3c', // Vibrant green
  secondary: '#66bb6a', // Lighter green
  accent: '#1b5e20', // Dark green
  background: '#f6fff7', // Very light green background
  surface: '#e8f5e9', // Card background
  text: '#1b5e20', // Dark text
  textLight: '#388e3c', // Lighter text
  border: '#b2dfdb', // Light border
};

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

// Ojas-specific summary styles
const ojasSummaryStyles = StyleSheet.create({
  card: {
    backgroundColor: OJAS_COLORS.surface,
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
    borderColor: OJAS_COLORS.border,
  },
  value: { fontSize: 22, fontWeight: 'bold', marginTop: 6, color: OJAS_COLORS.text },
  label: { fontSize: 13, color: OJAS_COLORS.textLight, marginTop: 2, textAlign: 'center' },
});

// Catena Cafe summary styles
const catenaSummaryStyles = StyleSheet.create({
  card: {
    backgroundColor: CATENA_COLORS.surface,
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
    borderColor: CATENA_COLORS.border,
  },
  value: { fontSize: 22, fontWeight: 'bold', marginTop: 6, color: CATENA_COLORS.text },
  label: { fontSize: 13, color: CATENA_COLORS.textLight, marginTop: 2, textAlign: 'center' },
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

  // Ojas-specific state
  const isOjas = branchId === 'ojas';
  const [ojasSalesList, setOjasSalesList] = useState<any[]>([]);
  const [ojasExpensesList, setOjasExpensesList] = useState<any[]>([]);
  const [ojasVendorsList, setOjasVendorsList] = useState<any[]>([]);
  const [ojasMaintenanceList, setOjasMaintenanceList] = useState<any[]>([]);
  const [ojasPaymentsList, setOjasPaymentsList] = useState<any[]>([]);
  // Ojas summary values
  let ojasTodaySales = 0, ojasTodayExpenses = 0, ojasVendorCount = 0, ojasOpenMaintCount = 0, ojasPaidPayments = 0, ojasPendingPayments = 0;
  if (isOjas) {
    const now = new Date();
    ojasTodaySales = ojasSalesList.filter(s => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt.seconds ? s.createdAt.seconds * 1000 : s.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, s) => sum + (s.cash || 0), 0);
    ojasTodayExpenses = ojasExpensesList.filter(e => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt.seconds ? e.createdAt.seconds * 1000 : e.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, e) => sum + (e.cash || 0), 0);
    ojasVendorCount = ojasVendorsList.length;
    ojasOpenMaintCount = ojasMaintenanceList.filter(m => m.status?.toLowerCase() !== 'done').length;
    ojasPaidPayments = ojasPaymentsList.filter(p => p.status === 'done' || p.status === 'paid').length;
    ojasPendingPayments = ojasPaymentsList.filter(p => p.status === 'pending').length;
  }

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

  // Ojas chart data
  let ojasChartLabels: string[] = [];
  let ojasSalesData: number[] = [];
  let ojasExpensesData: number[] = [];
  if (isOjas) {
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      ojasChartLabels.push(label);
      // Sales sum for this day
      const salesSum = ojasSalesList
        .filter(s => {
          if (!s.createdAt) return false;
          const date = new Date(s.createdAt.seconds ? s.createdAt.seconds * 1000 : s.createdAt);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, s) => sum + (s.cash || 0), 0);
      ojasSalesData.push(salesSum);
      // Expenses sum for this day
      const expenseSum = ojasExpensesList
        .filter(e => {
          if (!e.createdAt) return false;
          const date = new Date(e.createdAt.seconds ? e.createdAt.seconds * 1000 : e.createdAt);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, e) => sum + (e.cash || 0), 0);
      ojasExpensesData.push(expenseSum);
    }
  }

  // Calculate summary stats for today
  let todaySales = 0, todayExpenses = 0, vendorCount = 0, openMaintCount = 0, paidPayments = 0, pendingPayments = 0;
  let todayPendingSalesCount = 0;
  let todayPendingSalesAmount = 0;
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
    const todayPendingSales = salesList.filter(s => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt.seconds * 1000);
      return (
        s.status === 'pending' &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    todayPendingSalesCount = todayPendingSales.length;
    todayPendingSalesAmount = todayPendingSales.reduce((sum, s) => sum + (s.cash || 0), 0);
  }

  // Calculate totals and averages for tooltip
  const salesTotal = salesData.reduce((a, b) => a + b, 0);
  const salesAvg = salesData.length ? Math.round(salesTotal / salesData.length) : 0;
  const expensesTotal = expensesData.reduce((a, b) => a + b, 0);
  const expensesAvg = expensesData.length ? Math.round(expensesTotal / expensesData.length) : 0;

  // Catena Cafe-specific state
  const isCatenaCafe = branchId === 'catenaCafe';
  const [catenaSalesList, setCatenaSalesList] = useState<any[]>([]);
  const [catenaExpensesList, setCatenaExpensesList] = useState<any[]>([]);
  const [catenaVendorsList, setCatenaVendorsList] = useState<any[]>([]);
  const [catenaMaintenanceList, setCatenaMaintenanceList] = useState<any[]>([]);
  const [catenaPaymentsList, setCatenaPaymentsList] = useState<any[]>([]);
  // Catena Cafe summary values
  let catenaTodaySales = 0, catenaTodayExpenses = 0, catenaVendorCount = 0, catenaOpenMaintCount = 0, catenaPaidPayments = 0, catenaPendingPayments = 0;
  if (isCatenaCafe) {
    const now = new Date();
    catenaTodaySales = catenaSalesList.filter(s => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt.seconds ? s.createdAt.seconds * 1000 : s.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, s) => sum + (s.cash || 0), 0);
    catenaTodayExpenses = catenaExpensesList.filter(e => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt.seconds ? e.createdAt.seconds * 1000 : e.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, e) => sum + (e.cash || 0), 0);
    catenaVendorCount = catenaVendorsList.length;
    catenaOpenMaintCount = catenaMaintenanceList.filter(m => m.status?.toLowerCase() !== 'done').length;
    catenaPaidPayments = catenaPaymentsList.filter(p => p.status === 'done' || p.status === 'paid').length;
    catenaPendingPayments = catenaPaymentsList.filter(p => p.status === 'pending').length;
  }
  // Catena Cafe chart data
  let catenaChartLabels: string[] = [];
  let catenaSalesData: number[] = [];
  let catenaExpensesData: number[] = [];
  if (isCatenaCafe) {
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      catenaChartLabels.push(label);
      // Sales sum for this day
      const salesSum = catenaSalesList
        .filter(s => {
          if (!s.createdAt) return false;
          const date = new Date(s.createdAt.seconds ? s.createdAt.seconds * 1000 : s.createdAt);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, s) => sum + (s.cash || 0), 0);
      catenaSalesData.push(salesSum);
      // Expenses sum for this day
      const expenseSum = catenaExpensesList
        .filter(e => {
          if (!e.createdAt) return false;
          const date = new Date(e.createdAt.seconds ? e.createdAt.seconds * 1000 : e.createdAt);
          return (
            date.getFullYear() === d.getFullYear() &&
            date.getMonth() === d.getMonth() &&
            date.getDate() === d.getDate()
          );
        })
        .reduce((sum, e) => sum + (e.cash || 0), 0);
      catenaExpensesData.push(expenseSum);
    }
  }

  // Add state for orientEliteRooms
  const [orientEliteRooms, setOrientEliteRooms] = useState<any[]>([]);
  let activeRoomsCount = 0;
  if (isOrientElite) {
    activeRoomsCount = orientEliteRooms.filter(r => r.status === 'active').length;
  }

  // Add state for orientEliteFoodBills
  const [orientEliteFoodBills, setOrientEliteFoodBills] = useState<any[]>([]);
  let todayFoodBillAmount = 0;
  if (isOrientElite) {
    const now = new Date();
    todayFoodBillAmount = orientEliteFoodBills.filter(fb => {
      if (!fb.createdAt) return false;
      const d = new Date(fb.createdAt.seconds ? fb.createdAt.seconds * 1000 : fb.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).reduce((sum, fb) => sum + (fb.amount || 0), 0);
  }

  // Add state for orientEliteDormitory
  const [orientEliteDormitory, setOrientEliteDormitory] = useState<any[]>([]);
  let activeDormBedsCount = 0;
  if (isOrientElite) {
    activeDormBedsCount = orientEliteDormitory.filter(b => b.status === 'active').length;
  }

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

    if (isOjas) {
      // Ojas Sales
      const salesQ = query(collection(db, 'ojassale'));
      const unsubSales = onSnapshot(salesQ, snap => {
        setOjasSalesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Ojas Expenses
      const expensesQ = query(collection(db, 'ojasexpense'));
      const unsubExpenses = onSnapshot(expensesQ, snap => {
        setOjasExpensesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Ojas Vendors
      const vendorsQ = query(collection(db, 'ojasvendors'));
      const unsubVendors = onSnapshot(vendorsQ, snap => {
        setOjasVendorsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Ojas Maintenance
      const maintQ = query(collection(db, 'ojasmaintenance'));
      const unsubMaint = onSnapshot(maintQ, snap => {
        setOjasMaintenanceList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Ojas Vendor Payments
      const payQ = query(collection(db, 'ojasvendorpayments'));
      const unsubPay = onSnapshot(payQ, snap => {
        setOjasPaymentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubSales(); unsubExpenses(); unsubVendors(); unsubMaint(); unsubPay(); };
    }
    if (isCatenaCafe) {
      // Catena Cafe Sales
      const salesQ = query(collection(db, 'catenacafesale'));
      const unsubSales = onSnapshot(salesQ, snap => {
        setCatenaSalesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Catena Cafe Expenses
      const expensesQ = query(collection(db, 'catenacafeexpense'));
      const unsubExpenses = onSnapshot(expensesQ, snap => {
        setCatenaExpensesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Catena Cafe Vendors
      const vendorsQ = query(collection(db, 'catenacafevendors'));
      const unsubVendors = onSnapshot(vendorsQ, snap => {
        setCatenaVendorsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Catena Cafe Maintenance
      const maintQ = query(collection(db, 'catenacafemaintenance'));
      const unsubMaint = onSnapshot(maintQ, snap => {
        setCatenaMaintenanceList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Catena Cafe Vendor Payments
      const payQ = query(collection(db, 'catenacafevendorpayments'));
      const unsubPay = onSnapshot(payQ, snap => {
        setCatenaPaymentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubSales(); unsubExpenses(); unsubVendors(); unsubMaint(); unsubPay(); };
    }
    if (isOrientElite) {
      const unsubRooms = onSnapshot(collection(db, 'orientEliteRooms'), snap => {
        setOrientEliteRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubFoodBills = onSnapshot(collection(db, 'foodBills'), snap => {
        setOrientEliteFoodBills(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(fb => fb.branchId === 'orientElite'));
      });
      const unsubDorm = onSnapshot(collection(db, 'orientEliteDormitory'), snap => {
        setOrientEliteDormitory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => { unsubSales(); unsubExpenses(); unsubVendors(); unsubMaint(); unsubPay(); unsubRooms(); unsubFoodBills(); unsubDorm(); };
    }
    return () => { unsubSales(); unsubExpenses(); unsubVendors(); unsubMaint(); unsubPay(); };
  }, [branchId]);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: isOjas ? OJAS_COLORS.primary : PRIMARY_COLOR }}>{branchName} Dashboard</Text>
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
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] } onPress={() => router.push('/hotel-orient-elite-sales-report')}>
              <MaterialCommunityIcons name="cash" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>₹{todaySales}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Today&apos;s Sales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }]} onPress={() => router.push('/hotel-orient-elite-expense-report')}>
              <MaterialCommunityIcons name="bank" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>₹{todayExpenses}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Today&apos;s Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff' }]} onPress={() => router.push('/hotel-orient-elite-vendors')}>
              <MaterialCommunityIcons name="account-group" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{vendorCount}</Text>
              <Text style={summaryStyles.label}>Vendors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff' }]} onPress={() => router.push('/hotel-orient-elite-rooms')}>
              <MaterialCommunityIcons name="bed" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{activeRoomsCount}</Text>
              <Text style={summaryStyles.label}>Active Rooms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff' }]} onPress={() => router.push('/hotel-orient-elite-food-bills')}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>₹{todayFoodBillAmount}</Text>
              <Text style={summaryStyles.label}>Food Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff' }]} onPress={() => router.push({ pathname: '/hotel-orient-elite-dormitory' })}>
              <MaterialCommunityIcons name="bed-king" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{activeDormBedsCount}</Text>
              <Text style={summaryStyles.label}>Dormitory Beds</Text>
            </TouchableOpacity>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <MaterialCommunityIcons name="wrench" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{openMaintCount}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Open Maintenance</Text>
            </View>
            <View style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }] }>
              <TouchableOpacity onPress={() => router.push('/hotel-orient-elite-payments-paid')} style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="check-circle" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{paidPayments}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Payments Paid</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[summaryStyles.card, { backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 }]} onPress={() => router.push('/hotel-orient-elite-payments-pending')}>
              <MaterialCommunityIcons name="clock-outline" size={32} color={SECONDARY_COLOR} />
              <Text style={[summaryStyles.value, { color: '#111' }]}>{todayPendingSalesAmount}</Text>
              <Text style={[summaryStyles.label, { color: '#888' }]}>Payments Pending</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {isOjas && (
        <>
          {/* Chart for Ojas */}
          <View style={{ marginBottom: 32, backgroundColor: OJAS_COLORS.background, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, marginTop: 24, borderColor: OJAS_COLORS.primary, borderWidth: 1 }}>
            <View style={{ position: 'relative' }}>
              <LineChart
                data={{
                  labels: ojasChartLabels,
                  datasets: [
                    { data: ojasSalesData, color: () => selectedSeries === null || selectedSeries === 'sales' ? OJAS_COLORS.primary : 'rgba(139,69,19,0.3)', strokeWidth: 3, withDots: true },
                    { data: ojasExpensesData, color: () => selectedSeries === null || selectedSeries === 'expenses' ? OJAS_COLORS.accent : 'rgba(220,20,60,0.3)', strokeWidth: 3, withDots: true },
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
                  backgroundColor: OJAS_COLORS.background,
                  backgroundGradientFrom: OJAS_COLORS.background,
                  backgroundGradientTo: OJAS_COLORS.background,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(44,44,44,${opacity})`,
                  labelColor: (opacity = 1) => `rgba(44,44,44,${opacity})`,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: OJAS_COLORS.background, pointerEvents: 'auto' },
                  propsForBackgroundLines: { stroke: OJAS_COLORS.border, strokeDasharray: '4' },
                  propsForLabels: { fontWeight: 'bold', fontSize: 14 },
                  style: { borderRadius: 18 },
                  fillShadowGradient: OJAS_COLORS.primary,
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
                  if (ojasSalesData[index] === value) {
                    series = 'Sales';
                    color = OJAS_COLORS.primary;
                  } else if (ojasExpensesData[index] === value) {
                    series = 'Expenses';
                    color = OJAS_COLORS.accent;
                  }
                  setPointTooltip({
                    x,
                    y,
                    value,
                    label: ojasChartLabels[index],
                    color,
                    series,
                  });
                }}
              />
              {/* Per-point Tooltip Box as overlay */}
              {pointTooltip && (
                <View style={{ position: 'absolute', left: pointTooltip.x - 80, top: pointTooltip.y - 90, backgroundColor: OJAS_COLORS.background, borderRadius: 12, padding: 16, minWidth: 140, minHeight: 70, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 3, zIndex: 20, alignItems: 'flex-start', borderWidth: 1, borderColor: OJAS_COLORS.border }}>
                  <MaterialCommunityIcons name="close" size={20} color={OJAS_COLORS.text} onPress={() => setPointTooltip(null)} style={{ position: 'absolute', top: 8, right: 8 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: pointTooltip.series === 'Sales' ? OJAS_COLORS.primary : OJAS_COLORS.accent, marginBottom: 4, marginTop: 8, textAlign: 'left' }}>{pointTooltip.series}</Text>
                  <Text style={{ fontSize: 15, color: OJAS_COLORS.text, fontWeight: 'bold', textAlign: 'left' }}>₹{pointTooltip.value}</Text>
                  <Text style={{ fontSize: 13, color: OJAS_COLORS.textLight, marginTop: 2, textAlign: 'left' }}>{pointTooltip.label}</Text>
                </View>
              )}
            </View>
            {/* Custom Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: OJAS_COLORS.primary, marginRight: 6, borderWidth: selectedSeries === 'sales' ? 2 : 0, borderColor: OJAS_COLORS.primary, opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ color: OJAS_COLORS.primary, fontWeight: selectedSeries === 'sales' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.5 }}>Sales</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 32 }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: OJAS_COLORS.accent, marginRight: 6, borderWidth: selectedSeries === 'expenses' ? 2 : 0, borderColor: OJAS_COLORS.accent, opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ color: OJAS_COLORS.accent, fontWeight: selectedSeries === 'expenses' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.5 }}>Expenses</Text>
              </View>
            </View>
          </View>
          {/* Section Header for Summary */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: OJAS_COLORS.primary, marginBottom: 10, marginLeft: 2, marginTop: 8 }}>Today&apos;s Summary</Text>
          {/* Summary Cards Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18, columnGap: 12, marginBottom: 24 }}>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-sales-report')}>
              <MaterialCommunityIcons name="cash" size={32} color={OJAS_COLORS.primary} />
              <Text style={[ojasSummaryStyles.value]}>₹{ojasTodaySales}</Text>
              <Text style={[ojasSummaryStyles.label]}>Today&apos;s Sales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-expense-report')}>
              <MaterialCommunityIcons name="bank" size={32} color={OJAS_COLORS.accent} />
              <Text style={[ojasSummaryStyles.value]}>₹{ojasTodayExpenses}</Text>
              <Text style={[ojasSummaryStyles.label]}>Today&apos;s Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-vendors')}>
              <MaterialCommunityIcons name="account-group" size={32} color={OJAS_COLORS.secondary} />
              <Text style={[ojasSummaryStyles.value]}>{ojasVendorCount}</Text>
              <Text style={[ojasSummaryStyles.label]}>Vendors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-riddhi-siddhi-hall')}>
              <MaterialCommunityIcons name="party-popper" size={32} color={OJAS_COLORS.highlight} />
              <Text style={[ojasSummaryStyles.value]}>Riddhi Siddhi Hall</Text>
              <Text style={[ojasSummaryStyles.label]}>Riddhi Siddhi Hall</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push({ pathname: '/ojas-raw-materials' })}>
              <MaterialCommunityIcons name="shopping" size={32} color={OJAS_COLORS.secondary} />
              <Text style={[ojasSummaryStyles.value]}>Raw Materials</Text>
              <Text style={[ojasSummaryStyles.label]}>Raw Materials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-foodbill-report')}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={OJAS_COLORS.accent} />
              <Text style={[ojasSummaryStyles.value]}>Food Bill</Text>
              <Text style={[ojasSummaryStyles.label]}>Food Bill</Text>
            </TouchableOpacity>
            <View style={[ojasSummaryStyles.card]}>
              <MaterialCommunityIcons name="wrench" size={32} color={OJAS_COLORS.highlight} />
              <Text style={[ojasSummaryStyles.value]}>{ojasOpenMaintCount}</Text>
              <Text style={[ojasSummaryStyles.label]}>Open Maintenance</Text>
            </View>
            <View style={[ojasSummaryStyles.card]}>
              <MaterialCommunityIcons name="check-circle" size={32} color={OJAS_COLORS.secondary} />
              <Text style={[ojasSummaryStyles.value]}>{ojasPaidPayments}</Text>
              <Text style={[ojasSummaryStyles.label]}>Payments Paid</Text>
            </View>
            <TouchableOpacity style={[ojasSummaryStyles.card]} onPress={() => router.push('/ojas-payments-pending')}>
              <MaterialCommunityIcons name="clock-outline" size={32} color={OJAS_COLORS.accent} />
              <Text style={[ojasSummaryStyles.value]}>{ojasPendingPayments}</Text>
              <Text style={[ojasSummaryStyles.label]}>Payments Pending</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {isCatenaCafe && (
        <>
          {/* Chart for Catena Cafe */}
          <View style={{ marginBottom: 32, backgroundColor: CATENA_COLORS.background, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1, marginTop: 24, borderColor: CATENA_COLORS.primary, borderWidth: 1 }}>
            <View style={{ position: 'relative' }}>
              <LineChart
                data={{
                  labels: catenaChartLabels,
                  datasets: [
                    { data: catenaSalesData, color: () => selectedSeries === null || selectedSeries === 'sales' ? CATENA_COLORS.primary : 'rgba(56,142,60,0.3)', strokeWidth: 3, withDots: true },
                    { data: catenaExpensesData, color: () => selectedSeries === null || selectedSeries === 'expenses' ? CATENA_COLORS.accent : 'rgba(27,94,32,0.3)', strokeWidth: 3, withDots: true },
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
                  backgroundColor: CATENA_COLORS.background,
                  backgroundGradientFrom: CATENA_COLORS.background,
                  backgroundGradientTo: CATENA_COLORS.background,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(27,94,32,${opacity})`,
                  labelColor: (opacity = 1) => `rgba(27,94,32,${opacity})`,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: CATENA_COLORS.background, pointerEvents: 'auto' },
                  propsForBackgroundLines: { stroke: CATENA_COLORS.border, strokeDasharray: '4' },
                  propsForLabels: { fontWeight: 'bold', fontSize: 14 },
                  style: { borderRadius: 18 },
                  fillShadowGradient: CATENA_COLORS.primary,
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
                  if (catenaSalesData[index] === value) {
                    series = 'Sales';
                    color = CATENA_COLORS.primary;
                  } else if (catenaExpensesData[index] === value) {
                    series = 'Expenses';
                    color = CATENA_COLORS.accent;
                  }
                  setPointTooltip({
                    x,
                    y,
                    value,
                    label: catenaChartLabels[index],
                    color,
                    series,
                  });
                }}
              />
              {/* Per-point Tooltip Box as overlay */}
              {pointTooltip && (
                <View style={{ position: 'absolute', left: pointTooltip.x - 80, top: pointTooltip.y - 90, backgroundColor: CATENA_COLORS.background, borderRadius: 12, padding: 16, minWidth: 140, minHeight: 70, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 3, zIndex: 20, alignItems: 'flex-start', borderWidth: 1, borderColor: CATENA_COLORS.border }}>
                  <MaterialCommunityIcons name="close" size={20} color={CATENA_COLORS.text} onPress={() => setPointTooltip(null)} style={{ position: 'absolute', top: 8, right: 8 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: pointTooltip.series === 'Sales' ? CATENA_COLORS.primary : CATENA_COLORS.accent, marginBottom: 4, marginTop: 8, textAlign: 'left' }}>{pointTooltip.series}</Text>
                  <Text style={{ fontSize: 15, color: CATENA_COLORS.text, fontWeight: 'bold', textAlign: 'left' }}>₹{pointTooltip.value}</Text>
                  <Text style={{ fontSize: 13, color: CATENA_COLORS.textLight, marginTop: 2, textAlign: 'left' }}>{pointTooltip.label}</Text>
                </View>
              )}
            </View>
            {/* Custom Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: CATENA_COLORS.primary, marginRight: 6, borderWidth: selectedSeries === 'sales' ? 2 : 0, borderColor: CATENA_COLORS.primary, opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'sales' ? null : 'sales')} style={{ color: CATENA_COLORS.primary, fontWeight: selectedSeries === 'sales' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'sales' ? 1 : 0.5 }}>Sales</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 32 }}>
                <View onTouchEnd={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: CATENA_COLORS.accent, marginRight: 6, borderWidth: selectedSeries === 'expenses' ? 2 : 0, borderColor: CATENA_COLORS.accent, opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.3 }} />
                <Text onPress={() => setSelectedSeries(selectedSeries === 'expenses' ? null : 'expenses')} style={{ color: CATENA_COLORS.accent, fontWeight: selectedSeries === 'expenses' ? 'bold' : 'normal', fontSize: 15, opacity: selectedSeries === null || selectedSeries === 'expenses' ? 1 : 0.5 }}>Expenses</Text>
              </View>
            </View>
          </View>
          {/* Section Header for Summary */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: CATENA_COLORS.primary, marginBottom: 10, marginLeft: 2, marginTop: 8 }}>Today&apos;s Summary</Text>
          {/* Summary Cards Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18, columnGap: 12, marginBottom: 24 }}>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push('/catena-cafe-sales-report')}>
              <MaterialCommunityIcons name="cash" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>₹{catenaTodaySales}</Text>
              <Text style={[catenaSummaryStyles.label]}>Today&apos;s Sales</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push('/catena-cafe-expense-report')}>
              <MaterialCommunityIcons name="bank" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>₹{catenaTodayExpenses}</Text>
              <Text style={[catenaSummaryStyles.label]}>Today&apos;s Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push('/catena-cafe-vendors')}>
              <MaterialCommunityIcons name="account-group" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>{catenaVendorCount}</Text>
              <Text style={[catenaSummaryStyles.label]}>Vendors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push({ pathname: '/catena-raw-materials' })}>
              <MaterialCommunityIcons name="shopping" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>Raw Materials</Text>
              <Text style={[catenaSummaryStyles.label]}>Raw Materials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push('/catena-cafe-foodbill-report')}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>Food Bill</Text>
              <Text style={[catenaSummaryStyles.label]}>Food Bill</Text>
            </TouchableOpacity>
            <View style={[catenaSummaryStyles.card]}>
              <MaterialCommunityIcons name="wrench" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>{catenaOpenMaintCount}</Text>
              <Text style={[catenaSummaryStyles.label]}>Open Maintenance</Text>
            </View>
            <View style={[catenaSummaryStyles.card]}>
              <MaterialCommunityIcons name="check-circle" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>{catenaPaidPayments}</Text>
              <Text style={[catenaSummaryStyles.label]}>Payments Paid</Text>
            </View>
            <TouchableOpacity style={[catenaSummaryStyles.card]} onPress={() => router.push('/catena-cafe-payments-pending')}>
              <MaterialCommunityIcons name="clock-outline" size={32} color={CATENA_COLORS.primary} />
              <Text style={[catenaSummaryStyles.value]}>{catenaPendingPayments}</Text>
              <Text style={[catenaSummaryStyles.label]}>Payments Pending</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {/* For other branches, keep the old UI (if needed) */}
      {!isOrientElite && !isOjas && !isCatenaCafe && (
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
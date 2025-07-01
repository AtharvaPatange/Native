import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Building2, DollarSign, Receipt, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { SalesEntry, ExpenseEntry } from '@/types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { selectedBranch, setSelectedBranch } = useBranch();
  const [todaySales, setTodaySales] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [loading, setLoading] = useState(true);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (user && user.role !== 'globalAdmin' && user.role !== 'admin') {
      router.replace('/sales');
    }
  }, [user]);

  useEffect(() => {
    if (!selectedBranch) {
      router.replace('/branch-selector');
      return;
    }
    fetchDashboardData();
  }, [selectedBranch]);

  const fetchDashboardData = async () => {
    if (!selectedBranch) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().substring(0, 7);

      // Fetch today's sales
      const salesQuery = query(
        collection(db, 'sales'),
        where('branchId', '==', selectedBranch.id),
        where('date', '==', today)
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesTotal = salesSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data() as SalesEntry;
        return sum + data.total;
      }, 0);

      // Fetch today's expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('branchId', '==', selectedBranch.id),
        where('date', '==', today)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesTotal = expensesSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data() as ExpenseEntry;
        return sum + data.total;
      }, 0);

      // Fetch monthly sales
      const monthlySalesQuery = query(
        collection(db, 'sales'),
        where('branchId', '==', selectedBranch.id),
        orderBy('date', 'desc')
      );
      const monthlySalesSnapshot = await getDocs(monthlySalesQuery);
      const monthlyTotal = monthlySalesSnapshot.docs
        .filter(doc => doc.data().date.startsWith(currentMonth))
        .reduce((sum, doc) => {
          const data = doc.data() as SalesEntry;
          return sum + data.total;
        }, 0);

      setTodaySales(salesTotal);
      setTodayExpenses(expensesTotal);
      setMonthlySales(monthlyTotal);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBranchSelector = () => {
    setSelectedBranch(null);
    router.replace('/branch-selector');
  };

  if (!selectedBranch) return null;

  const profit = todaySales - todayExpenses;
  const branchColor = selectedBranch.color;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: branchColor }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToBranchSelector}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Building2 size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{selectedBranch.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.salesCard]}>
            <DollarSign size={24} color="#059669" />
            <Text style={styles.metricValue}>₹{todaySales.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Today's Sales</Text>
          </View>

          <View style={[styles.metricCard, styles.expenseCard]}>
            <Receipt size={24} color="#DC2626" />
            <Text style={styles.metricValue}>₹{todayExpenses.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Today's Expenses</Text>
          </View>
        </View>

        <View style={[styles.profitCard, profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
          <TrendingUp size={24} color={profit >= 0 ? "#059669" : "#DC2626"} />
          <Text style={[styles.profitValue, { color: profit >= 0 ? "#059669" : "#DC2626" }]}>
            ₹{Math.abs(profit).toLocaleString()}
          </Text>
          <Text style={styles.profitLabel}>
            Today's {profit >= 0 ? 'Profit' : 'Loss'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Monthly Performance</Text>
        
        <View style={styles.monthlyCard}>
          <Text style={styles.monthlyValue}>₹{monthlySales.toLocaleString()}</Text>
          <Text style={styles.monthlyLabel}>This Month's Sales</Text>
          <View style={styles.monthlyChart}>
            <Text style={styles.chartPlaceholder}>
              📊 Detailed analytics coming soon
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: branchColor + '20' }]}
            onPress={() => router.push('/sales')}
          >
            <DollarSign size={20} color={branchColor} />
            <Text style={[styles.actionButtonText, { color: branchColor }]}>
              Add Sales Entry
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: branchColor + '20' }]}
            onPress={() => router.push('/expenses')}
          >
            <Receipt size={20} color={branchColor} />
            <Text style={[styles.actionButtonText, { color: branchColor }]}>
              Add Expense Entry
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  salesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  profitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profitPositive: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  profitNegative: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  profitValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  monthlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthlyValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  monthlyLabel: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  monthlyChart: {
    height: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    color: '#64748B',
    fontSize: 14,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
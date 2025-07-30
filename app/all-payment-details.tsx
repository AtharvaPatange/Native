import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { DataTable, Text } from 'react-native-paper';

const PRIMARY_COLOR = '#e0a86b';
const SECONDARY_COLOR = '#e2af7a';

interface PaymentTransaction {
  id: string;
  wherePaid: string;
  amount: number;
  date: string;
  time?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export default function AllPaymentDetailsScreen() {
  const { userRole, loading } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);

  // Check permissions first
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (userRole !== 'globalAdmin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.accessDeniedContent}>
          <MaterialCommunityIcons name="lock" size={80} color="#fff" />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedMessage}>
            This page is accessible only to Global Administrators.
          </Text>
        </View>
      </View>
    );
  }

  // Only fetch data if user is global admin
  useEffect(() => {
    if (userRole !== 'globalAdmin') return;

    const q = query(
      collection(db, 'paymentTransactions'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PaymentTransaction[];
      setTransactions(data);
      setTotal(data.reduce((sum, t) => sum + (t.amount || 0), 0));
    }, (error) => {
      console.error('Error fetching payment details:', error);
      Alert.alert('Error', 'Failed to load payment details');
    });
    
    return () => unsubscribe();
  }, [userRole]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#fff" style={styles.titleIcon} />
            <Text style={styles.title}>All Payment Details</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>₹{total}</Text>
            <Text style={styles.totalLabel}>Total</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.dashboardContainer}>
          <Text style={styles.sectionTitle}>All Payment Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-multiple" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubText}>Payment transactions will appear here</Text>
            </View>
          ) : (
            <View style={styles.tableContainer}>
        <DataTable>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={[styles.column, { flex: 2 }]}>
                    <Text style={styles.headerText}>Where Paid</Text>
                  </DataTable.Title>
                  <DataTable.Title style={[styles.column, { flex: 1 }]}>
                    <Text style={styles.headerText}>Amount</Text>
                  </DataTable.Title>
                  <DataTable.Title style={[styles.column, { flex: 1.8 }]}>
                    <Text style={styles.headerText}>Date</Text>
                  </DataTable.Title>
          </DataTable.Header>

                {transactions.map((transaction, index) => (
                  <DataTable.Row key={transaction.id} style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow
                  ]}>
                    <DataTable.Cell style={[styles.column, { flex: 2 }]}>
                      <Text style={styles.cellText} numberOfLines={2}>{transaction.wherePaid}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.column, { flex: 1 }]}>
                      <Text style={styles.amountText}>₹{transaction.amount}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={[styles.column, { flex: 1.8 }]}>
                      <Text style={styles.cellText}>{transaction.date}</Text>
                    </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedContent: {
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    height: 100,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dashboardContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  cellText: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#111',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
}); 
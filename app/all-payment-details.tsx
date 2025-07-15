import { useAuth } from '@/components/AuthContext';
import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
  const { userRole } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);

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
    });
    return () => unsubscribe();
  }, [userRole]);

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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <LinearGradient
          colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.headerTitle}>All Payment Details</Text>
        <Text style={styles.totalText}>Total Paid: ₹{total}</Text>
      </View>
      <ScrollView style={styles.container}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Where Paid</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
            <DataTable.Title style={{ width: 32 }}> </DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
          </DataTable.Header>
          {transactions.map((transaction) => (
            <DataTable.Row key={transaction.id}>
              <DataTable.Cell>{transaction.wherePaid}</DataTable.Cell>
              <DataTable.Cell numeric>₹{transaction.amount}</DataTable.Cell>
              <View style={{ width: 32 }} />
              <DataTable.Cell>{transaction.date}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: PRIMARY_COLOR,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
}); 
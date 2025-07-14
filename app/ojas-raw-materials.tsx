import { db } from '@/constants/firebaseConfig';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function OjasRawMaterials() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'ojasRawPurchases'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Ojas Raw Materials</Text>
      {data.map(entry => (
        <Card key={entry.id} style={styles.card}>
          <Card.Title title={`Date: ${entry.date}`} />
          <Card.Content>
            {entry.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAmount}>₹{item.amount}</Text>
              </View>
            ))}
            <Text style={styles.dayTotal}>
              Day Total: ₹{entry.items.reduce((sum, i) => sum + (i.amount || 0), 0)}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#e0a86b',
    alignSelf: 'center',
  },
  card: {
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemAmount: {
    fontSize: 16,
    color: '#1976d2',
  },
  dayTotal: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#388e3c',
    fontSize: 16,
    alignSelf: 'flex-end',
  },
}); 
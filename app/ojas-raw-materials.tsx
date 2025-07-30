import { db } from '@/constants/firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

const PRIMARY_BROWN = '#8D6748';
const SECONDARY_BROWN = '#CBB292';
const DARK_BROWN = '#5D4037';

export default function OjasRawMaterials() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ojasRawPurchases'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateTotalAmount = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="shopping" size={32} color={DARK_BROWN} />
        <Text style={styles.header}>Hotel Ojas Raw Materials</Text>
        <Text style={styles.subHeader}>Purchase Records & Inventory</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="loading" size={48} color={PRIMARY_BROWN} />
            <Text style={styles.loadingText}>Loading raw materials data...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color={PRIMARY_BROWN} />
            <Text style={styles.emptyText}>No raw materials data found</Text>
            <Text style={styles.emptySubText}>Purchase records will appear here</Text>
          </View>
        ) : (
          <>
            {/* <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="calendar" size={24} color={DARK_BROWN} />
                  <Text style={styles.summaryLabel}>Total Days</Text>
                  <Text style={styles.summaryValue}>{data.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="package-variant" size={24} color={DARK_BROWN} />
                  <Text style={styles.summaryLabel}>Total Items</Text>
                  <Text style={styles.summaryValue}>
                    {data.reduce((sum, entry) => sum + (entry.items?.length || 0), 0)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <MaterialCommunityIcons name="currency-inr" size={24} color={DARK_BROWN} />
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>
                    ₹{data.reduce((sum, entry) => sum + calculateTotalAmount(entry.items || []), 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View> */}

            {data.map((entry, index) => (
              <Card key={entry.id} style={[styles.card, index === 0 && styles.firstCard]}>
                <Card.Title 
                  title={formatDate(entry.date)}
                  titleStyle={styles.cardTitle}
                  left={(props) => (
                    <MaterialCommunityIcons 
                      {...props} 
                      name="calendar-check" 
                      size={24} 
                      color={DARK_BROWN} 
                    />
                  )}
                />
                <Card.Content style={styles.cardContent}>
                  {entry.items?.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <MaterialCommunityIcons name="package-variant" size={16} color={PRIMARY_BROWN} />
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                      <Text style={styles.itemAmount}>₹{item.amount?.toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <MaterialCommunityIcons name="currency-inr" size={20} color={DARK_BROWN} />
                    <Text style={styles.dayTotal}>
                      Day Total: ₹{calculateTotalAmount(entry.items || []).toLocaleString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_BROWN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginTop: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginTop: 2,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BROWN,
  },
  firstCard: {
    borderLeftColor: DARK_BROWN,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BROWN,
  },
  cardContent: {
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK_BROWN,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: SECONDARY_BROWN,
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_BROWN,
    marginLeft: 8,
  },
}); 